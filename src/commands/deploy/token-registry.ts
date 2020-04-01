import { Argv } from "yargs";

export const command = "token-registry <registry-name> <registry-symbol> [options]";

export const describe = "Deploys a token registry contract on the blockchain";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("registry-name", {
      description: "Name of the token",
      normalize: true
    })
    .positional("registry-symbol", {
      description: "Symbol of the token (typically 3 characters)",
      normalize: true
    })
    .option("network", {
      alias: "n",
      choices: ["mainnet", "ropsten"],
      default: "mainnet",
      description: "Ethereum network to deploy to"
    })
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

export const handler = (args: any): void => {
  return console.log(args);
};

export default {
  command,
  describe,
  builder,
  handler
};

// Network
// Private key (key or keyfile or env or wallet file)
// Contract params
