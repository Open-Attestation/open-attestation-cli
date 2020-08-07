import { TradeTrustErc721Factory } from "@govtechsg/token-registry";
import { getWallet } from "../../utils/wallet";
import signale from "signale";
import { getLogger } from "../../../logger";
import { TransactionReceipt } from "@ethersproject/providers";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { dryRunMode } from "../../utils/dryRun";

const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
  dryRun,
}: DeployTokenRegistryCommand): Promise<TransactionReceipt> => {
  if (dryRun) {
    // TODO this does not work ?
    const factory = new TradeTrustErc721Factory();
    await dryRunMode({
      network,
      gasPriceScale: gasPriceScale,
      transaction: factory.getDeployTransaction(registryName, registrySymbol, {}),
    });
    process.exit(0);
  }
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new TradeTrustErc721Factory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(registryName, registrySymbol, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
