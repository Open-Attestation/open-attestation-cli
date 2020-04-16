import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { TradeTrustERC721 } from "@govtechsg/token-registry/types/TradeTrustERC721";
import { getDefaultProvider, Wallet } from "ethers";
import { getPrivateKey } from "../../private-key";

interface DeployTokenRegistryCmd {
  registryName: string;
  registrySymbol: string;
  network: string;
  key?: string;
  keyFile?: string;
}

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  network,
  key,
  keyFile
}: DeployTokenRegistryCmd): Promise<TradeTrustERC721> => {
  const privateKey = getPrivateKey({ key, keyFile });
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const signer = new Wallet(privateKey, provider);
  const factory = new TradeTrustERC721Factory(signer);
  return factory.deploy(registryName, registrySymbol);
};
