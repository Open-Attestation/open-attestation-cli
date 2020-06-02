import { TitleEscrowFactory } from "@govtechsg/token-registry";
import { getDefaultProvider, Wallet } from "ethers";
import { getPrivateKey } from "../../private-key";
import signale from "signale";
import { getLogger } from "../../../logger";
import { TransactionReceipt } from "ethers/providers";
import { DeployTitleEscrowCommand } from "../../../commands/deploy/deploy.types";

const { trace } = getLogger("deploy:title-escrow");

export const deployTitleEscrow = async ({
  tokenRegistryAddress,
  beneficiary,
  holder,
  titleEscrowFactoryAddress,
  network,
  key,
  keyFile
}: DeployTitleEscrowCommand): Promise<TransactionReceipt> => {
  const privateKey = getPrivateKey({ key, keyFile });
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const factory = new TitleEscrowFactory(new Wallet(privateKey, provider));
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(tokenRegistryAddress, beneficiary, holder, titleEscrowFactoryAddress);
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
