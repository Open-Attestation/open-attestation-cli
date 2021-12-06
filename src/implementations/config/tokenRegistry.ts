import { info, success } from "signale";
import { highlight } from "../../utils";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";

export const getTokenRegistryAddress = async (walletFilePath: string): Promise<string> => {
  const { contractAddress } = await createTokenRegistry(walletFilePath);
  success(`Token registry deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

const createTokenRegistry = async (walletFilePath: string): Promise<{ contractAddress: string }> => {
  info(`Enter password to continue deployment of Token Registry`);
  const deployTokenRegistryParams = {
    registryName: "Demo Token Registry",
    registrySymbol: "DTR",
    encryptedWalletPath: walletFilePath,
    network: "ropsten",
    gasPriceScale: 1,
    dryRun: false,
  };
  return deployTokenRegistry(deployTokenRegistryParams);
};
