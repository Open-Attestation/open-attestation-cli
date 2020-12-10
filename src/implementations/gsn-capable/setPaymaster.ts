import { GsnCapableDocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { GsnCapableSetPaymasterCommand } from "../../commands/gsn-capable/gsn-capable-command.type";
import { getWallet } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("gsn-capable:set-paymaster");

export const setPaymasterForGsnCapableContract = async ({
  gsnCapableAddress,
  paymasterAddress,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
  dryRun,
}: GsnCapableSetPaymasterCommand): Promise<TransactionReceipt> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  if (dryRun) {
    const gsnDocumentStore = await GsnCapableDocumentStoreFactory.connect(gsnCapableAddress, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await gsnDocumentStore.estimateGas.setPaymaster(paymasterAddress),
      network,
    });
    process.exit(0);
  }

  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const transaction = await GsnCapableDocumentStoreFactory.connect(gsnCapableAddress, wallet).setPaymaster(
    paymasterAddress,
    {
      gasPrice: gasPrice.mul(gasPriceScale),
    }
  );
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
