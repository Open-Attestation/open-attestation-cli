import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreTransferOwnershipCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { calculateMaxFee, scaleBigNumber } from "../../utils";

const { trace } = getLogger("document-store:transfer-ownership");

export const transferDocumentStoreOwnershipToWallet = async ({
  address,
  newOwner,
  network,
  maxPriorityFeePerGasScale,
  dryRun,
  ...rest
}: DocumentStoreTransferOwnershipCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  if (dryRun) {
    const documentStore = await DocumentStoreFactory.connect(address, wallet);
    await dryRunMode({
      estimatedGas: await documentStore.estimateGas.transferOwnership(newOwner),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  await documentStore.callStatic.transferOwnership(newOwner);
  const transaction = await documentStore.transferOwnership(newOwner, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
