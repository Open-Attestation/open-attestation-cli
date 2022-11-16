import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWalletOrSigner } from "../../utils/wallet";
import { dryRunMode } from "../../utils/dryRun";
import { BigNumber } from "ethers";

const { trace } = getLogger("deploy:document-store");

export const deployDocumentStore = async ({
  storeName,
  network,
  maxFeePerGasScale,
  maxPriorityFeePerGasScale,
  feeData,
  ...rest
}: DeployDocumentStoreCommand): Promise<{ contractAddress: string }> => {
  if (feeData) {
    await dryRunMode({
      transaction: new DocumentStoreFactory().getDeployTransaction(storeName),
      network,
    });
    process.exit(0);
  }

  const wallet = await getWalletOrSigner({ network, ...rest });
  const factory = new DocumentStoreFactory(wallet);
  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  const transaction = await factory.deploy(storeName, {
    maxFeePerGas: (maxFeePerGas || BigNumber.from(0)).mul(maxFeePerGasScale),

    maxPriorityFeePerGas: (maxPriorityFeePerGas || BigNumber.from(0)).mul(maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
