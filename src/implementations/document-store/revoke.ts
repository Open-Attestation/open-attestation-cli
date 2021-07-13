import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRevokeCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";

const { trace } = getLogger("document-store:revoke");

export const revokeToDocumentStore = async ({
  address,
  hash,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: DocumentStoreRevokeCommand): Promise<{ transactionHash: string }> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  if (dryRun) {
    const documentStore = await DocumentStoreFactory.connect(address, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await documentStore.estimateGas.revoke(hash),
      network,
    });
    process.exit(0);
  }
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
