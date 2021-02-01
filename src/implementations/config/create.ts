import { ethers, getDefaultProvider, Wallet, providers } from "ethers";
import inquirer from "inquirer";
import signale from "signale";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { CreateConfigCommand } from "../../commands/config/config.type";
import { progress as defaultProgress } from "../../implementations/utils/progress";
import { NetworkOption, WalletOption, NetworkAndKeyOption, GasOption } from "../../commands/shared";

import { DocumentStoreFactory } from "@govtechsg/document-store";
import { TransactionReceipt } from "@ethersproject/providers";
import { DocumentStoreIssueCommand } from "../../commands/document-store/document-store-command.type";
// import { getWallet } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";

const { trace } = getLogger("document-store:issue");

export const createWallet = async ({
  progress = defaultProgress("Encrypting Wallet"),
}: CreateConfigCommand & { progress?: (progress: number) => void }): Promise<string> => {
  const wallet = ethers.Wallet.createRandom();
  const { password } = await inquirer.prompt({
    type: "password",
    name: "password",
    message: "Wallet password",
  });

  const json = await wallet.encrypt(password, progress);

  signale.info(
    `Wallet with public address ${highlight(wallet.address)} successfully created. Find more details: ${JSON.stringify(
      json,
      null,
      2
    )}`
  );

  return json;
};

interface GetWalletProps {
  network: string;
  walletJson: string;
  progress?: (progress: number) => void;
}

interface DocumentStoreProps {
  storeName: string;
  network: string;
  walletJson: string;
  gasPriceScale: number;
}

const getWallet = async ({
  network,
  walletJson,
  progress = defaultProgress("Decrypting Wallet")
}: GetWalletProps): Promise<Wallet> => {
  const provider =
  network === "local"
    ? new providers.JsonRpcProvider()
    : getDefaultProvider(network === "mainnet" ? "homestead" : network);
  const { password } = await inquirer.prompt({ type: "password", name: "password", message: "Wallet password" });  
  const wallet = await ethers.Wallet.fromEncryptedJson(walletJson, password, progress);  
  signale.info("Wallet successfully decrypted"); 
  return wallet.connect(provider);
}

export const deployDocumentStore = async ({
  storeName,
  network,
  walletJson,
  gasPriceScale
}: DocumentStoreProps) => {
  const wallet = await getWallet({network, walletJson})
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new DocumentStoreFactory(wallet);
  signale.await(`Sending transaction to pool`);  
  const transaction = await factory.deploy(storeName, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
}
