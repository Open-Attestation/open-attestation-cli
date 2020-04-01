import { readFileSync } from "fs";
import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { TradeTrustERC721 } from "@govtechsg/token-registry/types/TradeTrustERC721";
import { Wallet, getDefaultProvider } from "ethers";

interface DeployTokenRegistryCmd {
  registryName: string;
  registrySymbol: string;
  network: string;
  key?: string;
  keyFile?: string;
}

export const getKeyFromFile = (file?: string): undefined | string => {
  return file ? readFileSync(file).toString() : undefined;
};

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  network,
  key,
  keyFile
}: DeployTokenRegistryCmd): Promise<TradeTrustERC721> => {
  const privateKey = key || getKeyFromFile(keyFile) || process.env["OA_PRIVATE_KEY"];
  if (!privateKey)
    throw new Error("No private key found in OA_PRIVATE_KEY, key or key-file, please supply at least one");
  const provider = getDefaultProvider(network === "mainnet" ? undefined : network); // undefined network defaults to homestead (aka mainnet)
  const signer = new Wallet(privateKey, provider);
  const factory = new TradeTrustERC721Factory(signer);
  const tokenRegistry = await factory.deploy(registryName, registrySymbol);
  return tokenRegistry;
};
