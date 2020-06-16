import { Argv } from "yargs";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { success, error, info } from "signale";
import { getLogger } from "../../logger";

const { trace } = getLogger("deploy:token-registry");

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

export const handler = async (args: any): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying token registry ${args.registryName}`);
    const tokenRegistry = await deployTokenRegistry(args);
    success(`Token registry deployed at ${tokenRegistry.contractAddress}`);
    info(
      `Find more details at https://${args.network === "ropsten" ? "ropsten." : ""}etherscan.io/address/${
        tokenRegistry.contractAddress
      }`
    );
    return tokenRegistry.contractAddress;
  } catch (e) {
    error(e.message);
  }
};
