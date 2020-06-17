import { DocumentStoreFactory } from "@govtechsg/document-store";
import { getDefaultProvider, Wallet } from "ethers";
import signale from "signale";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getPrivateKey } from "../../private-key";

const { trace } = getLogger("deploy:document-store");

export const deployDocumentStore = async ({
  storeName,
  network,
  key,
  keyFile,
  gasPriceScale
}: DeployDocumentStoreCommand): Promise<{ contractAddress: string }> => {
  const privateKey = getPrivateKey({ key, keyFile });
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const gasPrice = await provider.getGasPrice();
  const factory = new DocumentStoreFactory(new Wallet(privateKey, provider));
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(storeName, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
