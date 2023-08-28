import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreTransferOwnershipCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getGasFees } from "../../utils";

const { trace } = getLogger("document-store:transfer-ownership");

export const transferDocumentStoreOwnershipToWallet = async ({
  address,
  newOwner,
  network,
  dryRun,
  ...rest
}: DocumentStoreTransferOwnershipCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await documentStore.estimateGas.transferOwnership(newOwner),
      network,
    });
    process.exit(0);
  }
  const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
  await documentStore.callStatic.transferOwnership(newOwner, { ...gasFees });
  signale.await(`Sending transaction to pool`);
  const transaction = await documentStore.transferOwnership(newOwner, { ...gasFees });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
