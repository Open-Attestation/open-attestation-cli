import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRevokeCommand } from "../../commands/document-store/document-store-command.type";
import { getWallet } from "../utils/wallet";

const { trace } = getLogger("document-store:revoke");

export const revokeToDocumentStore = async ({
  address,
  hash,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
}: DocumentStoreRevokeCommand): Promise<{ transactionHash: string }> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const transaction = await DocumentStoreFactory.connect(address, wallet).revoke(hash, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
