import { TitleEscrowCreatorFactory } from "@govtechsg/token-registry";
import { getWallet } from "../../utils/wallet";
import signale from "signale";
import { getLogger } from "../../../logger";
import { TransactionReceipt } from "ethers/providers";
import { DeployTitleEscrowCreatorCommand } from "../../../commands/deploy/deploy.types";

const { trace } = getLogger("deploy:title-escrow-creator");

export const deployTitleEscrowCreator = async ({
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
}: DeployTitleEscrowCreatorCommand): Promise<TransactionReceipt> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new TitleEscrowCreatorFactory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy({ gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
