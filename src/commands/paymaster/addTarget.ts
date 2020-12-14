import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { addTargetToPaymaster } from "../../implementations/paymaster/addTarget";
import { PaymasterAddTargetCommand } from "./paymaster-command.type";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("paymaster:add-target");

export const command = "add-target [options]";

export const describe = "Registers a contract with a paymaster deployed on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .option("target-address", {
          alias: "a",
          description: "Address of contract to register to paymaster",
          type: "string",
          demandOption: true,
        })
        .option("paymaster-address", {
          alias: "p",
          description: "Address of paymaster paying for contract",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: PaymasterAddTargetCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Registering ${args.targetAddress} to paymaster ${args.paymasterAddress}`);
    const { transactionHash } = await addTargetToPaymaster({
      ...args,
    });
    success(`Contract with address ${args.targetAddress} has been registered on paymaster ${args.paymasterAddress}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(e.message);
  }
};
