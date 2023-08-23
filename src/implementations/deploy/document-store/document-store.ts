import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWalletOrSigner } from "../../utils/wallet";
import { dryRunMode } from "../../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { calculateMaxFee, scaleBigNumber } from "../../../utils";

const { trace } = getLogger("deploy:document-store");

export const deployDocumentStore = async ({
  storeName,
  owner,
  network,
  maxPriorityFeePerGasScale,
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
  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  const transaction = await factory.deploy(storeName, ownerAddress, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
