import { Argv } from "yargs";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { success, error, info } from "signale";
import { getLogger } from "../../logger";
import { withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("deploy:token-registry");

export const command = "token-registry <registry-name> <registry-symbol> [options]";

export const describe = "Deploys a token registry contract on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withNetworkAndKeyOption(
    yargs
      .positional("registry-name", {
        description: "Name of the token",
        normalize: true
      })
      .positional("registry-symbol", {
        description: "Symbol of the token (typically 3 characters)",
        normalize: true
      })
  );

export const handler = async (args: any): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying token registry ${args.registryName}`);
    const tokenRegistry = await deployTokenRegistry(args);
    success(`Token registry deployed at ${tokenRegistry.contractAddress}`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${tokenRegistry.contractAddress}`
    );
    return tokenRegistry.contractAddress;
  } catch (e) {
    error(e.message);
  }
};
