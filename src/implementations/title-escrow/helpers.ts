import {
  TitleEscrow,
  TitleEscrow__factory,
  TradeTrustToken,
  TradeTrustToken__factory,
} from "@govtechsg/token-registry/contracts";
import { Wallet, constants } from "ethers";
import signale from "signale";
import { ConnectedSigner } from "../utils/wallet";

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

export const connectToTitleEscrow = async ({
  tokenId,
  address,
  wallet,
}: ConnectToTitleEscrowArgs): Promise<TitleEscrow> => {
  const tokenRegistry: TradeTrustToken = await TradeTrustToken__factory.connect(address, wallet);
  const titleEscrowAddress = await tokenRegistry.ownerOf(tokenId);
  return await TitleEscrow__factory.connect(titleEscrowAddress, wallet);
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

interface validateEndorseChangeOwnerArgs {
  newHolder: string;
  newOwner: string;
  titleEscrow: TitleEscrow;
}
export const validateEndorseChangeOwner = async ({
  newHolder,
  newOwner,
  titleEscrow,
}: validateEndorseChangeOwnerArgs): Promise<void> => {
  const beneficiary = await titleEscrow.beneficiary();
  const holder = await titleEscrow.holder();
  if (newOwner === beneficiary && newHolder === holder) {
    const error = "new owner and new holder addresses are the same as the current owner and holder addresses";
    signale.error(error);
    throw new Error(error);
  }
};

interface validateNominateBeneficiaryArgs {
  beneficiaryNominee: string;
  titleEscrow: TitleEscrow;
}
export const validateNominateBeneficiary = async ({
  beneficiaryNominee,
  titleEscrow,
}: validateNominateBeneficiaryArgs): Promise<void> => {
  const beneficiary = await titleEscrow.beneficiary();
  if (beneficiaryNominee === beneficiary) {
    const error = "new beneficiary address is the same as the current beneficiary address";
    signale.error(error);
    throw new Error(error);
  }
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
