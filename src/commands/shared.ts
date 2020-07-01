import { Argv } from "yargs";

export interface NetworkOption {
  network: string;
}

export interface WalletOption {
  key?: string;
  keyFile?: string;
  encryptedWalletPath?: string;
}

export interface GasOption {
  gasPriceScale: number;
}

export interface NetworkAndKeyOption extends NetworkOption, WalletOption {}

export const withNetworkOption = (yargs: Argv): Argv =>
  yargs.option("network", {
    alias: "n",
    choices: ["mainnet", "ropsten", "rinkeby"],
    default: "mainnet",
    description: "Ethereum network to deploy to"
  });
export const withGasPriceOption = (yargs: Argv): Argv =>
  yargs.option("gas-price-scale", {
    alias: "gps",
    type: "number",
    default: 1,
    description: "Gas price scale to apply to the estimated gas price"
  });
export const withWalletOption = (yargs: Argv): Argv =>
  yargs
    .option("key", {
      alias: "k",
      type: "string",
      description: "Private key of owner account"
    })
    .option("key-file", {
      alias: "f",
      type: "string",
      description: "Path to file containing private key of owner account"
    })
    .option("encrypted-wallet-path", {
      type: "string",
      description: "Path to file containing private key of owner account",
      normalize: true
    });
export const withNetworkAndKeyOption = (yargs: Argv): Argv => withNetworkOption(withWalletOption(yargs));
