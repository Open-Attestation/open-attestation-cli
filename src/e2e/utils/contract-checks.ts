import { Provider } from "@ethersproject/abstract-provider";
import { constants } from "@govtechsg/token-registry";
import {
  TitleEscrow__factory,
  TradeTrustToken,
  TradeTrustToken__factory,
} from "@govtechsg/token-registry/dist/contracts";
import { BigNumber, Signer, Wallet } from "ethers";
import { getSupportedNetwork } from "../../commands/networks";
import { addAddressPrefix } from "../../utils";
import { TokenInfo } from "./constants";

type SignerOrProvider = Signer | Provider;

export interface TokenRegistryInfo {
  name: string;
  symbol: string;
}

export interface TitleEscrowInfo {
  titleEscrow: string;
  beneficiary: string;
  holder: string;
  nominee: string;
  active: boolean;
  tokenId: BigNumber;
  registry: string;
  isHoldingToken: boolean;
}

export interface RolesInfo {
  minterRole: boolean;
  accepterRole: boolean;
  restorerRole: boolean;
  defaultRole: boolean;
}

export const retrieveWalletEscrowDetails = async (
  signer: Signer,
  tokenInfo: TokenInfo
): Promise<TokenRegistryInfo | TitleEscrowInfo | RolesInfo> => {
  const escrowDetails = await retrieveEscrowDetails(signer, tokenInfo);
  const titleEscrowDetails = await rolesCheck(signer, tokenInfo.tokenRegistry);
  return {
    ...escrowDetails,
    ...titleEscrowDetails,
  };
};

export const retrieveEscrowDetails = async (
  signerOrProvider: SignerOrProvider,
  tokenInfo: TokenInfo
): Promise<TokenRegistryInfo | TitleEscrowInfo> => {
  //TODO: check ownership
  const { tokenRegistry, tokenId, titleEscrowAddress } = tokenInfo;
  if (!titleEscrowAddress) throw new Error("Escrow Address unspecified");
  const tokenDetails = await retrieveTokenInfo(signerOrProvider, tokenRegistry);
  let titleEscrowDetails: TitleEscrowInfo | undefined;
  if (!titleEscrowAddress) {
    titleEscrowDetails = await retrieveTitleEscrowInfo(signerOrProvider, titleEscrowAddress);
  } else {
    titleEscrowDetails = await retrieveTitleEscrow(signerOrProvider, tokenRegistry, tokenId);
  }
  return {
    ...tokenDetails,
    ...titleEscrowDetails,
  };
};

export const retrieveTokenInfo = async (
  signerOrProvider: SignerOrProvider,
  tokenRegistry: string
): Promise<TokenRegistryInfo> => {
  const token: TradeTrustToken = TradeTrustToken__factory.connect(tokenRegistry, signerOrProvider);
  const namePromise = token.name();
  const symbolPromise = token.symbol();
  const [name, symbol] = await Promise.all([namePromise, symbolPromise]);
  return {
    name,
    symbol,
  };
};

export const retrieveTitleEscrow = async (
  signerOrProvider: SignerOrProvider,
  tokenRegistry: string,
  tokenId: string
): Promise<TitleEscrowInfo> => {
  const token: TradeTrustToken = TradeTrustToken__factory.connect(tokenRegistry, signerOrProvider);
  const escrowAddress = await token.ownerOf(tokenId);
  return retrieveTitleEscrowInfo(signerOrProvider, escrowAddress);
};

export const retrieveTitleEscrowOwner = async (
  signerOrProvider: SignerOrProvider,
  tokenRegistry: string,
  tokenId: string
): Promise<string> => {
  const token: TradeTrustToken = TradeTrustToken__factory.connect(tokenRegistry, signerOrProvider);
  const escrowAddress = await token.ownerOf(tokenId);
  return escrowAddress;
};

export const retrieveTitleEscrowInfo = async (
  signerOrProvider: SignerOrProvider,
  titleEscrowAddress: string
): Promise<TitleEscrowInfo> => {
  const titleEscrow = TitleEscrow__factory.connect(titleEscrowAddress, signerOrProvider);
  const beneficiaryPromise: Promise<string> = titleEscrow.beneficiary();
  const holderPromise: Promise<string> = titleEscrow.holder();
  const nomineePromise: Promise<string> = titleEscrow.nominee();
  const activePromise: Promise<boolean> = titleEscrow.active();
  const tokenIdPromise: Promise<BigNumber> = titleEscrow.tokenId();
  const registryPromise: Promise<string> = titleEscrow.registry();
  const isHoldingTokenPromise: Promise<boolean> = titleEscrow.isHoldingToken();

  const [beneficiary, holder, nominee, active, tokenId, registry, isHoldingToken] = await Promise.all([
    beneficiaryPromise,
    holderPromise,
    nomineePromise,
    activePromise,
    tokenIdPromise,
    registryPromise,
    isHoldingTokenPromise,
  ]);
  return {
    titleEscrow: titleEscrowAddress,
    beneficiary,
    holder,
    nominee,
    active,
    tokenId,
    registry,
    isHoldingToken,
  };
};

export const rolesCheck = async (signerOrProvider: Signer, tokenRegistry: string): Promise<RolesInfo> => {
  const token: TradeTrustToken = TradeTrustToken__factory.connect(tokenRegistry, signerOrProvider);
  const walletAddress: string = await signerOrProvider.getAddress();
  const minterPromise = token.hasRole(constants.roleHash.MinterRole, walletAddress);
  const accepterPromise = token.hasRole(constants.roleHash.AccepterRole, walletAddress);
  const restorerPromise = token.hasRole(constants.roleHash.RestorerRole, walletAddress);
  const defaultPromise = token.hasRole(constants.roleHash.DefaultAdmin, walletAddress);
  const [minterRole, accepterRole, restorerRole, defaultRole] = await Promise.all([
    minterPromise,
    accepterPromise,
    restorerPromise,
    defaultPromise,
  ]);
  return {
    minterRole,
    accepterRole,
    restorerRole,
    defaultRole,
  };
};

export const getSigner = (network: string, privateKey: string): Signer => {
  return getSignerOrProvider(network, privateKey) as Signer;
};

export const getSignerOrProvider = (network: string, privateKey?: string): SignerOrProvider => {
  const provider = getSupportedNetwork(network ?? "local").provider();
  if (privateKey) {
    const hexlifiedPrivateKey = addAddressPrefix(privateKey);
    return new Wallet(hexlifiedPrivateKey, provider);
  }
  return provider;
};
