import { readFileSync } from "fs";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { getDefaultProvider, Wallet } from "ethers";
import signale from "signale";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
const { trace } = getLogger("deploy:document-store");

export const getKeyFromFile = (file?: string): undefined | string => {
  return file ? readFileSync(file).toString() : undefined;
};

export const deployDocumentStore = async ({
  storeName,
  network,
  key,
  keyFile
}: DeployDocumentStoreCommand): Promise<{ contractAddress: string }> => {
  const privateKey = key || getKeyFromFile(keyFile) || process.env["OA_PRIVATE_KEY"];
  if (!privateKey)
    throw new Error("No private key found in OA_PRIVATE_KEY, key or key-file, please supply at least one");
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const factory = new DocumentStoreFactory(new Wallet(privateKey, provider));
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(storeName);
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
