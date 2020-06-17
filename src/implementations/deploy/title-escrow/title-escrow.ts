import { TitleEscrowFactory } from "@govtechsg/token-registry";
import { getDefaultProvider, Wallet } from "ethers";
import { getPrivateKey } from "../../private-key";
import signale from "signale";
import { getLogger } from "../../../logger";
import { TransactionReceipt } from "ethers/providers";
import { DeployTitleEscrowCommand } from "../../../commands/deploy/deploy.types";
import { validateAddress } from "../../utils/validation";

const { trace } = getLogger("deploy:title-escrow");

export const deployTitleEscrow = async ({
  tokenRegistry,
  beneficiary,
  holder,
  titleEscrowFactory,
  network,
  key,
  keyFile,
  gasPriceScale
}: DeployTitleEscrowCommand): Promise<TransactionReceipt> => {
  validateAddress(tokenRegistry);
  validateAddress(beneficiary);
  validateAddress(holder);
  validateAddress(titleEscrowFactory);
  const privateKey = getPrivateKey({ key, keyFile });
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const gasPrice = await provider.getGasPrice();

  const factory = new TitleEscrowFactory(new Wallet(privateKey, provider));
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(tokenRegistry, beneficiary, holder, titleEscrowFactory, {
    gasPrice: gasPrice.mul(gasPriceScale)
  });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
