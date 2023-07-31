import {
  TradeTrustToken,
  TradeTrustToken__factory,
  TitleEscrow,
  TitleEscrow__factory,
} from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { ConnectedSigner } from "../utils/wallet";

type UserWallet = Wallet | ConnectedSigner;

export const connectToTokenRegistry = async (
  address: string,
  wallet: UserWallet,
): Promise<TradeTrustToken> => {
  const validAddress = isAddress(address);
  if (!validAddress) throw new Error(`Invalid token registry address: ${address}`);
  const tokenRegistryInstance: TradeTrustToken = await TradeTrustToken__factory.connect(address, wallet);
  return tokenRegistryInstance;
};

const addressCheck = (maybeAddress: string): void => {
  if (!isAddress(maybeAddress)) throw new Error(`Invalid contract address: ${maybeAddress}`);
};

const tokenIdCheck = (maybeTokenId: string): void => {
  const validHex = /^(0x|0X)?[a-fA-F0-9]+$/.test(maybeTokenId)
  if (!validHex) throw new Error(`Invalid token id: ${maybeTokenId}`);
};

interface ConnectToTitleEscrowArgs {
  tokenId: string;
  address: string;
  wallet: Wallet | ConnectedSigner;
}

export const connectToTitleEscrow = async ({
  tokenId,
  address,
  wallet,
}: ConnectToTitleEscrowArgs): Promise<TitleEscrow> => {
  const tokenRegistry: TradeTrustToken = await connectToTokenRegistry( address, wallet );
  const titleEscrowAddress = await getTitleEscrowAddress(tokenRegistry, tokenId);
  return await connectToTitleEscrowAddress(titleEscrowAddress, wallet);
};

export const connectToTitleEscrowAddress = async (address: string, wallet: UserWallet): Promise<TitleEscrow> => {
  addressCheck(address);
  const titleEscrow = TitleEscrow__factory.connect(address, wallet);
  return titleEscrow;
};

const getTitleEscrowAddress = async (tokenRegistry: TradeTrustToken, tokenId: string): Promise<string> => {
  tokenIdCheck(tokenId);
  return await tokenRegistry.ownerOf(tokenId);
}
