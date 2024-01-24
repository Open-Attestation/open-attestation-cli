import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreIssueCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getGasFees } from "../../utils";

const { trace } = getLogger("document-store:issue");

export const issueToDocumentStore = async ({
  address,
  hash,
  network,
  dryRun,
  ...rest
}: DocumentStoreIssueCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await documentStore.estimateGas.issue(hash),
      network,
    });
    process.exit(0);
  }
  const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
  trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
  trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
  await documentStore.callStatic.issue(hash);
  signale.await(`Sending transaction to pool`);
  const transaction = await documentStore.issue(hash, { ...gasFees });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
