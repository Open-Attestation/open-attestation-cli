import { TransactionReceipt } from "@ethersproject/providers";
import { TradeTrustErc721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { dryRunMode } from "../../utils/dryRun";
import { getWalletOrSigner } from "../../utils/wallet";

const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  network,
  gasPriceScale,
  dryRun,
  passedOnWallet, // passedOnWallet variable will only be used if we are calling it from create.
  ...rest
}: DeployTokenRegistryCommand): Promise<TransactionReceipt> => {
  const wallet = passedOnWallet ? passedOnWallet : await getWalletOrSigner({ network, ...rest });
  const factory = new TradeTrustErc721Factory(wallet);
  if (dryRun) {
    const unsignedTx = factory.getDeployTransaction(registryName, registrySymbol, {});
    const tx = await wallet.populateTransaction(unsignedTx);
    await dryRunMode({
      network,
      gasPriceScale: gasPriceScale,
      transaction: tx,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(registryName, registrySymbol, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
