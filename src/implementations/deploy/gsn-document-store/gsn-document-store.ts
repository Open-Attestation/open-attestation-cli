import { GsnCapableDocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { DeployGsnDocumentStoreCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWallet } from "../../utils/wallet";
import { dryRunMode } from "../../utils/dryRun";

const { trace } = getLogger("deploy:gsn-document-store");

export const deployGsnDocumentStore = async ({
  storeName,
  trustForwarderAddress,
  network,
  key,
  keyFile,
  gasPriceScale,
  dryRun,
  encryptedWalletPath,
}: DeployGsnDocumentStoreCommand): Promise<{ contractAddress: string }> => {
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      transaction: new GsnCapableDocumentStoreFactory().getDeployTransaction(storeName, trustForwarderAddress),
      network,
    });
    process.exit(0);
  }

  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new GsnCapableDocumentStoreFactory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(storeName, trustForwarderAddress, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
