import { info, success } from "signale";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { highlight } from "../../utils";

export const getDocumentStoreAddress = async (walletFilePath: string): Promise<string> => {
  const { contractAddress } = await createDocumentStore(walletFilePath);
  success(`Document store deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

const createDocumentStore = async (walletFilePath: string): Promise<{ contractAddress: string }> => {
  info(`Enter password to continue deployment of Document Store`);
  const deployDocumentStoreParams = {
    encryptedWalletPath: walletFilePath,
    network: "ropsten",
    gasPriceScale: 1,
    dryRun: false,
    storeName: "Document Store",
  };
  return deployDocumentStore(deployDocumentStoreParams);
};
