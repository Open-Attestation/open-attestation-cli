import { Argv } from "yargs";

export interface NetworkOption {
  network: string;
}

export interface KeyOption {
  key?: string;
  keyFile?: string;
}

export interface NetworkAndKeyOption extends NetworkOption, KeyOption {}

export const withNetworkOption = (yargs: Argv): Argv =>
  yargs.option("network", {
    alias: "n",
    choices: ["mainnet", "ropsten"],
    default: "mainnet",
    description: "Ethereum network to deploy to"
  });
export const withKeyOption = (yargs: Argv): Argv =>
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
    });
export const withNetworkAndKeyOption = (yargs: Argv): Argv => withNetworkOption(withKeyOption(yargs));
