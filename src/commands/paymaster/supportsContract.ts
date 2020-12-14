import { Argv } from "yargs";
import { error, info, success, fatal } from "signale";
import { getLogger } from "../../logger";
import { paymasterSupportsContract } from "../../implementations/paymaster/supportsContract";
import { PaymasterSupportsContractCommand } from "./paymaster-command.type";
import { withNetworkOption } from "../shared";

const { trace } = getLogger("paymaster:supports-contract");

export const command = "supports-contract [options]";

export const describe = "Check if given address is supported by paymaster";

export const builder = (yargs: Argv): Argv =>
  withNetworkOption(
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
  );

export const handler = async (args: PaymasterSupportsContractCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Checking ${args.targetAddress} is supported on paymaster ${args.paymasterAddress}`);
    const isSupported = await paymasterSupportsContract({
      ...args,
    });
    if (isSupported) {
      success(`Contract with address ${args.targetAddress} is supported paymaster ${args.paymasterAddress}`);
    } else {
      fatal(`Contract with address ${args.targetAddress} is not supported on paymaster ${args.paymasterAddress}`);
    }
  } catch (e) {
    error(e.message);
  }
};
