import {
  TitleEscrow,
  TitleEscrowFactory,
  TitleEscrowFactory__factory,
  TitleEscrow__factory,
  TradeTrustToken,
  TradeTrustToken__factory,
} from "@govtechsg/token-registry/contracts";
import { Wallet, constants, Contract } from "ethers";
import { isAddress } from "ethers/lib/utils";
import signale from "signale";
import { ConnectedSigner } from "../utils/wallet";

export const BurnAddress = "0x000000000000000000000000000000000000dEaD";

interface ConnectToTitleEscrowArgs {
  tokenId: string;
  address: string;
  wallet: UserWallet;
}

interface ConnectToTokenRegistryArgs {
  address: string;
  wallet: UserWallet;
}

type UserWallet = Wallet | ConnectedSigner;

export const assertAddressIsSmartContract = async (
  address: string,
  account: Wallet | ConnectedSigner
): Promise<void> => {
  const code = await account.provider.getCode(address);
  const isContract = code !== "0x" && code !== "0x0"; // Ganache uses 0x0 instead
  if (!isContract) throw new Error(`Address ${address} is not a valid Contract`);
};

interface ERC165Contract extends Contract {
  supportsInterface: (interfaceId: string) => Promise<boolean>;
}

export const supportsInterface = async (
  contractInstance: ERC165Contract,
  interfaceId: string
): Promise<boolean | undefined> => {
  let isSameInterfaceType;
  try {
    isSameInterfaceType = await contractInstance.supportsInterface(interfaceId);
    return isSameInterfaceType;
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("revert") || e.message.includes("cannot estimate gas")) {
        return false;
      }
    }
  }
};

const isJsonString = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
  } catch (e) {
    return false;
  }
  return true;
};

export const getTitleEscrowAddress = async (tokenRegistry: TradeTrustToken, tokenId: string): Promise<string> => {
  try {
    return await tokenRegistry.ownerOf(tokenId);
  } catch (e: any) {
    if (e?.code === "CALL_EXCEPTION" && e?.reason === "missing revert data in call exception" && e?.data === "0x") {
      const providerError = e?.error;
      if (providerError?.code === "SERVER_ERROR" && providerError?.reason === "processing response error") {
        if (isJsonString(providerError?.body)) {
          const VMError: any = JSON.parse(providerError?.body);
          if (
            VMError?.error?.message ===
            "VM Exception while processing transaction: revert ERC721: owner query for nonexistent token"
          ) {
            throw new Error(`Unminted Token`);
          }
        }
      }
    }
    throw e;
  }
};

export const connectToTitleEscrowAddress = async (address: string, wallet: UserWallet): Promise<TitleEscrow> => {
  await assertAddressIsSmartContract(address, wallet);
  const titleEscrow = TitleEscrow__factory.connect(address, wallet);
  // const isTitleEscrow = await supportsInterface(titleEscrow, "0x8a198f04")
  // if(!isTitleEscrow) throw new Error(`Address ${titleEscrowAddress} is not a supported escrow contract`)
  return titleEscrow;
};

export const connectToTitleEscrow = async ({
  tokenId,
  address,
  wallet,
}: ConnectToTitleEscrowArgs): Promise<TitleEscrow> => {
  await assertAddressIsSmartContract(address, wallet);
  const tokenRegistry: TradeTrustToken = await connectToTokenRegistry({ address, wallet });
  const titleEscrowAddress = await getTitleEscrowAddress(tokenRegistry, tokenId);
  if (titleEscrowAddress === BurnAddress) throw new Error(`Title Escrow has already been shredded`);
  if (titleEscrowAddress === address) throw new Error(`Title Escrow has already been surrendered`);
  await assertAddressIsSmartContract(titleEscrowAddress, wallet);
  const titleEscrow = connectToTitleEscrowAddress(titleEscrowAddress, wallet);
  return titleEscrow;
};

export const connectToTokenRegistry = async ({
  address,
  wallet,
}: ConnectToTokenRegistryArgs): Promise<TradeTrustToken> => {
  await assertAddressIsSmartContract(address, wallet);
  const tokenRegistryInstance: TradeTrustToken = await TradeTrustToken__factory.connect(address, wallet);
  // const isTokenRegistry = await supportsInterface(tokenRegistryInstance, "0x8a198f04")
  // if(!isTokenRegistry) throw new Error(`Address ${address} is not a supported token registry contract`)
  await tokenRegistryInstance.callStatic.genesis();
  return tokenRegistryInstance;
};

// State Checks

export const validateActiveTitleEscrow = async (titleEscrow: TitleEscrow): Promise<void> => {
  const activeEscrow = await titleEscrow.active();
  if (!activeEscrow) throw new Error(`Inactive Title Escrow`);
};

// Permissions check

export const EscrowRoles = {
  beneficiary: "beneficiary",
  holder: "holder",
  nominee: "nominee",
} as const;

export type EscrowRolesType = typeof EscrowRoles[keyof typeof EscrowRoles];

const hasTransferRights = async (
  titleEscrow: TitleEscrow,
  walletAddress: string,
  expectedPermissions: string[]
): Promise<boolean> => {
  for (const roles of expectedPermissions) {
    let rightsHolder = "";
    let results = true;
    switch (roles) {
      case EscrowRoles.beneficiary:
        rightsHolder = await titleEscrow.beneficiary();
        results = results && rightsHolder === walletAddress;
        break;
      case EscrowRoles.holder:
        rightsHolder = await titleEscrow.holder();
        results = results && rightsHolder === walletAddress;
        break;
      case EscrowRoles.nominee:
        rightsHolder = await titleEscrow.nominee();
        results = results && rightsHolder === walletAddress;
        break;
      default:
        throw new Error(`Unimplemented role: ${roles}`);
    }
    if (!results) return false;
  }
  return true;
};

interface validateTransferArgs {
  titleEscrow: TitleEscrow;
  to: string;
  walletAddress: string;
}

export const validateTransferHolder = async ({
  titleEscrow,
  to,
  walletAddress,
}: validateTransferArgs): Promise<void> => {
  if (!isAddress(walletAddress)) {
    ("Destination Holder is not a valid address");
  }
  await validateActiveTitleEscrow(titleEscrow);
  const haveRights = await hasTransferRights(titleEscrow, walletAddress, [EscrowRoles.holder]);
  if (!haveRights) throw new Error(`Wallet lack the rights for the transfer operation`);
  const isHolder = await hasTransferRights(titleEscrow, to, [EscrowRoles.holder]);
  if (isHolder) throw new Error(`Destination wallet already has the rights of holdership`);
};

export const validateTransferBeneficiary = async ({
  titleEscrow,
  to,
  walletAddress,
}: validateTransferArgs): Promise<void> => {
  if (!isAddress(walletAddress)) {
    ("Destination Beneficiary is not a valid address");
  }
  await validateActiveTitleEscrow(titleEscrow);
  const haveRights = await hasTransferRights(titleEscrow, walletAddress, [EscrowRoles.beneficiary, EscrowRoles.holder]);
  if (!haveRights) throw new Error(`Wallet lack the rights for the transfer operation`);
  const isBeneficiary = await hasTransferRights(titleEscrow, to, [EscrowRoles.beneficiary]);
  if (isBeneficiary) throw new Error(`Destination wallet already has the rights as beneficiary`);
  const isNominated = await hasTransferRights(titleEscrow, to, [EscrowRoles.nominee]);
  if (!isNominated) throw new Error(`Destination wallet has not been nominated`);
};

export const validateNominateBeneficiary = async ({
  walletAddress,
  to,
  titleEscrow,
}: validateTransferArgs): Promise<void> => {
  if (!isAddress(walletAddress)) {
    ("Destination Nominee is not a valid address");
  }
  await validateActiveTitleEscrow(titleEscrow);
  const haveRights = await hasTransferRights(titleEscrow, walletAddress, [EscrowRoles.beneficiary]);
  if (!haveRights) throw new Error(`Wallet lack the rights for the transfer operation`);
  const isBeneficiary = await hasTransferRights(titleEscrow, to, [EscrowRoles.beneficiary]);
  if (isBeneficiary) throw new Error(`Destination wallet already has the rights as beneficiary`);
};

interface validateEndorseChangeOwnerArgs {
  newHolder: string;
  newOwner: string;
  titleEscrow: TitleEscrow;
  walletAddress: string;
}
export const validateEndorseChangeOwner = async ({
  newHolder,
  newOwner,
  titleEscrow,
  walletAddress,
}: validateEndorseChangeOwnerArgs): Promise<void> => {
  await validateTransferHolder({ titleEscrow, to: newHolder, walletAddress });
  await validateTransferBeneficiary({ titleEscrow, to: newOwner, walletAddress });
};

interface validateEndorseTransferOwnerArgs {
  approvedOwner: string | undefined;
  approvedHolder: string | undefined;
}
const GENESIS_ADDRESS = constants.AddressZero;
export const validateEndorseTransferOwner = ({
  approvedOwner,
  approvedHolder,
}: validateEndorseTransferOwnerArgs): void => {
  if (!approvedOwner || !approvedHolder || approvedOwner === GENESIS_ADDRESS || approvedHolder === GENESIS_ADDRESS) {
    const error = `there is no approved owner or holder or the approved owner or holder is equal to the genesis address: ${GENESIS_ADDRESS}`;
    signale.error(error);
    throw new Error(error);
  }
};

interface validateSurrenderArgs {
  titleEscrow: TitleEscrow;
  walletAddress: string;
}

interface validateAcceptSurrenderArgs {
  tokenRegistry: TradeTrustToken;
  tokenId: string;
  wallet: UserWallet;
}

export const validateSurrender = async ({ titleEscrow, walletAddress }: validateSurrenderArgs): Promise<void> => {
  const haveRights = await hasTransferRights(titleEscrow, walletAddress, [EscrowRoles.holder, EscrowRoles.beneficiary]);
  if (!haveRights) throw new Error(`Wallet lack the rights for the transfer operation`);
};

export const connectToTitleEscrowFactory = async (
  tokenRegistry: TradeTrustToken,
  wallet: UserWallet
): Promise<TitleEscrowFactory> => {
  const titleEscrowFactoryAddress = await tokenRegistry.titleEscrowFactory();
  await assertAddressIsSmartContract(titleEscrowFactoryAddress, wallet);
  const titleEscrowFactory = TitleEscrowFactory__factory.connect(titleEscrowFactoryAddress, wallet);
  return titleEscrowFactory;
};

export const validateSurrenderMethod = async ({
  tokenRegistry,
  tokenId,
  wallet,
}: validateAcceptSurrenderArgs): Promise<void> => {
  const ownerOfTitleEscrow = await getTitleEscrowAddress(tokenRegistry, tokenId);
  if (ownerOfTitleEscrow !== tokenRegistry.address) throw new Error(`Title Escrow has not been surrendered`);
  const titleEscrowFactory = await connectToTitleEscrowFactory(tokenRegistry, wallet);
  // const isTitleEscrowFactory = await supportsInterface(validateAcceptSurrenderArgs, "?")
  // if(!isTitleEscrowFactory) throw new Error(`Address ${address} is not a supported title escrow factory contract`)
  const titleEscrowAddress = await titleEscrowFactory.getAddress(tokenRegistry.address, tokenId);
  const walletAddress = await wallet.getAddress();
  const titleEscrow = await connectToTitleEscrowAddress(titleEscrowAddress, wallet);
  const haveRights = await hasTransferRights(titleEscrow, walletAddress, [EscrowRoles.holder, EscrowRoles.beneficiary]);
  if (!haveRights) throw new Error(`Wallet lack the rights for the transfer operation`);
};
