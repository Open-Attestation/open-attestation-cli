import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreTransferOwnershipCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("document-store:transfer-ownership");

export const transferDocumentStoreOwnershipToWallet = async ({
  address,
  newOwner,
  network,
  dryRun,
  ...rest
}: DocumentStoreTransferOwnershipCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  if (dryRun) {
      signale.error("Dry run mode unavailable");
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  await documentStore.transferOwnership(newOwner);
  const transaction = await documentStore.transferOwnership(newOwner);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
