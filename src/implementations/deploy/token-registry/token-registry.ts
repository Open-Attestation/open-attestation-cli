import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { getWallet } from "../../utils/wallet";
import signale from "signale";
import { getLogger } from "../../../logger";
import { TransactionReceipt } from "ethers/providers";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";

const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
}: DeployTokenRegistryCommand): Promise<TransactionReceipt> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new TradeTrustERC721Factory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(registryName, registrySymbol, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
