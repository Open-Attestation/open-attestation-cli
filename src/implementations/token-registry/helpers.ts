import { TradeTrustERC721, TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { ConnectedSigner } from "../utils/wallet";

interface ConnectToTokenRegistryArgs {
  address: string;
  wallet: Wallet | ConnectedSigner;
}

export const connectToTokenRegistry = async ({
  address,
  wallet,
}: ConnectToTokenRegistryArgs): Promise<TradeTrustERC721> => {
    const tokenRegistry = await TradeTrustERC721Factory.connect(address, wallet);
    return tokenRegistry;
};
