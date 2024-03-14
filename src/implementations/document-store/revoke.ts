import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRevokeCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { getGasFees } from "../../utils";

const { trace } = getLogger("document-store:revoke");

export const revokeToDocumentStore = async ({
  address,
  hash,
  network,
  dryRun,
  ...rest
}: DocumentStoreRevokeCommand): Promise<{ transactionHash: string }> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await documentStore.estimateGas.revoke(hash),
      network,
    });
    process.exit(0);
  }
  const gasFees = await getGasFees({ provider: wallet.provider, network, ...rest });
  trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
  trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
  await documentStore.callStatic.revoke(hash);
  signale.await(`Sending transaction to pool`);
  const transaction = await documentStore.revoke(hash, { ...gasFees });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
