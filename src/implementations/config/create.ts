import { ethers, getDefaultProvider, Wallet, providers } from "ethers";
import inquirer from "inquirer";
import signale, { error, success } from "signale";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import {
  CreateConfigCommand,
  GetWalletProps,
  DocumentStoreProps,
  TokenRegistryProps,
} from "../../commands/config/config.type";
import { progress as defaultProgress } from "../../implementations/utils/progress";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { TradeTrustErc721Factory } from "@govtechsg/token-registry";
import fetch, { RequestInit } from "node-fetch";

const { trace } = getLogger("document-store:issue");

// export const createWallet = async ({
//   progress = defaultProgress("Encrypting Wallet"),
// }: CreateConfigCommand & { progress?: (progress: number) => void }): Promise<string> => {
//   const wallet = ethers.Wallet.createRandom();
//   const { password } = await inquirer.prompt({
//     type: "password",
//     name: "password",
//     message: "Wallet password",
//   });

//   const json = await wallet.encrypt(password, progress);
//   signale.info(`Wallet with public address ${highlight(wallet.address)} successfully created. Find more details: `);

//   return json;
// };

// interface GetWalletProps {
//   network: string;
//   walletJson: string;
//   progress?: (progress: number) => void;
// }

// interface DocumentStoreProps {
//   storeName: string;
//   network: string;
//   walletJson: string;
//   gasPriceScale: number;
// }

// interface TokenRegistryProps {
//   registryName: string;
//   registrySymbol: string;
//   network: string;
//   walletJson: string;
//   gasPriceScale: number;
// }

const getWallet = async ({
  network,
  walletJson,
  progress = defaultProgress("Decrypting Wallet"),
}: GetWalletProps): Promise<Wallet> => {
  const provider =
    network === "local"
      ? new providers.JsonRpcProvider()
      : getDefaultProvider(network === "mainnet" ? "homestead" : network);
  const { password } = await inquirer.prompt({ type: "password", name: "password", message: "Wallet password" });
  const wallet = await ethers.Wallet.fromEncryptedJson(walletJson, password, progress);
  signale.info("Wallet successfully decrypted");
  return wallet.connect(provider);
};

export const deployDocumentStore = async ({ storeName, network, walletJson, gasPriceScale }: DocumentStoreProps) => {
  const wallet = await getWallet({ network, walletJson });
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new DocumentStoreFactory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(storeName, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  network,
  walletJson,
  gasPriceScale,
}: TokenRegistryProps) => {
  const wallet = await getWallet({ network, walletJson });
  const gasPrice = await wallet.provider.getGasPrice();
  const factory = new TradeTrustErc721Factory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(registryName, registrySymbol, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};

export const createTempDNS = async (args: CreateConfigCommand) => {
  const baseUrl = args.sandboxEndpoint;
  try {
    const { executionId } = await request(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    const result = await request(`${baseUrl}/execution/${executionId}`);
    return result;
  } catch (e) {
    error(e.message);
  }
};

const request = (url: string, options?: RequestInit): Promise<any> => {
  return fetch(url, options)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`unexpected response ${response.statusText}`);
      }
      return response;
    })
    .then((response) => response.json());
};
