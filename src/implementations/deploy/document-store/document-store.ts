import { DocumentStore, DocumentStoreFactory } from "@tradetrust-tt/document-store";
import signale from "signale";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWalletOrSigner } from "../../utils/wallet";
import { dryRunMode } from "../../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { canEstimateGasPrice, getGasFees } from "../../../utils";

const { trace } = getLogger("deploy:document-store");

export const deployDocumentStore = async ({
  storeName,
  owner,
  network,
  dryRun,
  passedOnWallet,
  ...rest
}: DeployDocumentStoreCommand): Promise<TransactionReceipt> => {
  const wallet = passedOnWallet ? passedOnWallet : await getWalletOrSigner({ network, ...rest });
  const ownerAddress = owner ?? (await wallet.getAddress());
  if (dryRun) {
    await dryRunMode({
      transaction: new DocumentStoreFactory().getDeployTransaction(storeName, ownerAddress),
      network,
    });
    process.exit(0);
  }
  const factory = new DocumentStoreFactory(wallet);

  let transaction: DocumentStore;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    signale.await(`Sending transaction to pool`);
    transaction = await factory.deploy(storeName, ownerAddress, { ...gasFees });
  } else {
    signale.await(`Sending transaction to pool`);
    transaction = await factory.deploy(storeName, ownerAddress);
  }

  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
