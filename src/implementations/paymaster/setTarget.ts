import { NaivePaymasterFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { PaymasterSetTargetCommand } from "../../commands/paymaster/paymaster-command.type";
import { getWallet } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("paymaster:set-target");

export const setTargetToPaymaster = async ({
  targetAddress,
  paymasterAddress,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
  dryRun,
}: PaymasterSetTargetCommand): Promise<TransactionReceipt> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  if (dryRun) {
    const paymaster = await NaivePaymasterFactory.connect(paymasterAddress, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await paymaster.estimateGas.setTarget(targetAddress),
      network,
    });
    process.exit(0);
  }

  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const transaction = await NaivePaymasterFactory.connect(paymasterAddress, wallet).setTarget(targetAddress, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
