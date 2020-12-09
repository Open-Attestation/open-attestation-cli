import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { deployPaymaster } from "../../implementations/deploy/paymaster";
import { DeployPaymasterCommand } from "./deploy.types";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("deploy:paymaster");

export const command = "paymaster <paymaster-name> [options]";

export const describe = "Deploys a paymaster contract on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs.positional("paymaster-name", {
        description: "Name of the paymaster",
      })
    )
  );

export const handler = async (args: DeployPaymasterCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying paymaster ${args.paymasterName}`);
    const paymaster = await deployPaymaster(args);
    success(`Paymaster ${args.paymasterName} deployed at ${paymaster.contractAddress}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/address/${paymaster.contractAddress}`);
    return paymaster.contractAddress;
  } catch (e) {
    error(e.message);
  }
};
