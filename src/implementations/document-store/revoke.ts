import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRevokeCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { calculateMaxFee, scaleBigNumber } from "../../utils";

const { trace } = getLogger("document-store:revoke");

export const revokeToDocumentStore = async ({
  address,
  hash,
  network,
  maxPriorityFeePerGasScale,
  feeData,
  ...rest
}: DocumentStoreRevokeCommand): Promise<{ transactionHash: string }> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  if (feeData) {
    const documentStore = await DocumentStoreFactory.connect(address, wallet);
    await dryRunMode({
      estimatedGas: await documentStore.estimateGas.revoke(hash),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  await documentStore.callStatic.revoke(hash);
  const transaction = await documentStore.revoke(hash, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
