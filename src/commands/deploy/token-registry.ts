import { Argv } from "yargs";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";
import { DeployTokenRegistryCommand } from "./deploy.types";
const { trace } = getLogger("deploy:token-registry");

export const command = "token-registry <registry-name> <registry-symbol> [options]";

export const describe = "Deploys a token registry contract on the blockchain";

// Refer to @tradetrust-tt/token-registry tasks/deploy-token.ts

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .positional("name", {
          description: "Name of the token",
          normalize: true,
        })
        .positional("symbol", {
          description: "Symbol of the token (typically 3 characters)",
          normalize: true,
        })
        .option("standalone", {
          description: "Use Standalone Deployer, used with Title Escrow Factory (Optional)",
          type: "boolean",
          default: false,
        })
        .option("factory", {
          description: "Address of Title Escrow Factory (Optional)",
          type: "string",
          alias: "factory-address",
        })
        .option("token", {
          description: "Address of Token Implementation (Custom)",
          type: "string",
          alias: "token-implementation-address",
        })
        .hide("token")
        .option("deployer", {
          description: "Address of Deployer (Custom)",
          type: "string",
          alias: "deployer-address",
        })
        .hide("deployer")
    )
  );

export const handler = async (args: DeployTokenRegistryCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying token registry ${args.registryName}`);
    const tokenRegistry = await deployTokenRegistry(args);
    displayTransactionPrice(tokenRegistry.transaction);
    success(`Token registry deployed at ${tokenRegistry.contractAddress}`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${tokenRegistry.contractAddress}`
    );
    return tokenRegistry.contractAddress;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
