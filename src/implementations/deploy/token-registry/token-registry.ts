import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { getDefaultProvider, Wallet } from "ethers";
import { getPrivateKey } from "../../private-key";
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
  gasPriceScale
}: DeployTokenRegistryCommand): Promise<TransactionReceipt> => {
  const privateKey = getPrivateKey({ key, keyFile });
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const gasPrice = await provider.getGasPrice();
  const factory = new TradeTrustERC721Factory(new Wallet(privateKey, provider));
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(registryName, registrySymbol, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
