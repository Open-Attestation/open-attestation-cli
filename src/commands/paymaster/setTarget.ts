import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { setTargetToPaymaster } from "../../implementations/paymaster/setTarget";
import { PaymasterSetTargetCommand } from "./paymaster-command.type";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("paymaster:set-target");

export const command = "set-target [options]";

export const describe = "Registers a contract a paymaster deployed on the blockchain is willing to pay for";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .option("targetAddress", {
          alias: "a",
          description: "Address of contract to register to paymaster",
          type: "string",
          demandOption: true,
        })
        .option("paymasterAddress", {
          alias: "p",
          description: "Address of paymaster paying for contract",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: PaymasterSetTargetCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Registering ${args.targetAddress} to paymaster ${args.paymasterAddress}`);
    const { transactionHash } = await setTargetToPaymaster({
      ...args,
    });
    success(`Contract with address ${args.targetAddress} has been registered on paymaster ${args.paymasterAddress}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(e.message);
  }
};
