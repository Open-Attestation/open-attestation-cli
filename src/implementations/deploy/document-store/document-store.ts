import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWalletOrSigner } from "../../utils/wallet";
import { dryRunMode } from "../../utils/dryRun";

const { trace } = getLogger("deploy:document-store");

export const deployDocumentStore = async ({
  storeName,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: DeployDocumentStoreCommand): Promise<{ contractAddress: string }> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const ownerAddress = await wallet.getAddress();

  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      transaction: new DocumentStoreFactory().getDeployTransaction(storeName, ownerAddress),
      network,
    });
    process.exit(0);
  }

  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new DocumentStoreFactory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(storeName, ownerAddress, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
