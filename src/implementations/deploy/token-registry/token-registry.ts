import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { getWalletOrSigner } from "../../utils/wallet";
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
  gasPriceScale,
  dryRun,
  ...rest
}: DeployTokenRegistryCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const factory = new TradeTrustERC721Factory(wallet);
  if (dryRun) {
    const tx = factory.getDeployTransaction(registryName, registrySymbol, {});
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
