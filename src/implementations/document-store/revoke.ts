import { readFileSync } from "fs";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { getDefaultProvider, Wallet } from "ethers";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRevokeCommand } from "../../commands/document-store/document-store-command.type";

const { trace } = getLogger("document-store:revoke");

export const getKeyFromFile = (file?: string): undefined | string => {
  return file ? readFileSync(file).toString() : undefined;
};

export const revokeToDocumentStore = async ({
  address,
  hash,
  network,
  key,
  keyFile
}: DocumentStoreRevokeCommand): Promise<{ transactionHash: string }> => {
  const privateKey = key || getKeyFromFile(keyFile) || process.env["OA_PRIVATE_KEY"];
  if (!privateKey)
    throw new Error("No private key found in OA_PRIVATE_KEY, key or key-file, please supply at least one");
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  signale.await(`Sending transaction to pool`);
  const transaction = await DocumentStoreFactory.connect(address, new Wallet(privateKey, provider)).revoke(hash);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
