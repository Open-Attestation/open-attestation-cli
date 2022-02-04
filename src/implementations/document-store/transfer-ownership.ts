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
  gasPriceScale,
  dryRun,
  ...rest
}: DocumentStoreTransferOwnershipCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  if (dryRun) {
    const documentStore = await DocumentStoreFactory.connect(address, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await documentStore.estimateGas.transferOwnership(newOwner),
      network,
    });
    process.exit(0);
  }

  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  await documentStore.callStatic.transferOwnership(newOwner, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  const transaction = await documentStore.transferOwnership(newOwner, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
