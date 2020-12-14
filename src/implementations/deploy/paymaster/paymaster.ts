import { NaivePaymasterFactory } from "@govtechsg/document-store";
import signale from "signale";
import { DeployPaymasterCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWallet } from "../../utils/wallet";
import { dryRunMode } from "../../utils/dryRun";

const { trace } = getLogger("deploy:paymaster");

export const deployPaymaster = async ({
  paymasterName,
  network,
  key,
  keyFile,
  gasPriceScale,
  dryRun,
  encryptedWalletPath,
}: DeployPaymasterCommand): Promise<{ contractAddress: string }> => {
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      transaction: new NaivePaymasterFactory().getDeployTransaction(paymasterName),
      network,
    });
    process.exit(0);
  }

  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new NaivePaymasterFactory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(paymasterName, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
