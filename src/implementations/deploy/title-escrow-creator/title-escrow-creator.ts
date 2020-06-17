import { TitleEscrowCreatorFactory } from "@govtechsg/token-registry";
import { getDefaultProvider, Wallet } from "ethers";
import { getPrivateKey } from "../../private-key";
import signale from "signale";
import { getLogger } from "../../../logger";
import { TransactionReceipt } from "ethers/providers";
import { DeployTitleEscrowCreatorCommand } from "../../../commands/deploy/deploy.types";

const { trace } = getLogger("deploy:title-escrow-creator");

export const deployTitleEscrowCreator = async ({
  network,
  key,
  keyFile,
  gasPriceScale
}: DeployTitleEscrowCreatorCommand): Promise<TransactionReceipt> => {
  const privateKey = getPrivateKey({ key, keyFile });
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const gasPrice = await provider.getGasPrice();
  const factory = new TitleEscrowCreatorFactory(new Wallet(privateKey, provider));
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy({ gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
