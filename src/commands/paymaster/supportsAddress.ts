import { Argv } from "yargs";
import { error, info, success, fatal } from "signale";
import { getLogger } from "../../logger";
import { paymasterSupportsAddress } from "../../implementations/paymaster/supportsAddress";
import { PaymasterSupportsAddressCommand } from "./paymaster-command.type";
import { withNetworkOption } from "../shared";

const { trace } = getLogger("paymaster:supports-address");

export const command = "supports-address [options]";

export const describe = "Registers a contract a paymaster deployed on the blockchain is willing to pay for";

export const builder = (yargs: Argv): Argv =>
  withNetworkOption(
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
  );

export const handler = async (args: PaymasterSupportsAddressCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Checking ${args.targetAddress} is supported on paymaster ${args.paymasterAddress}`);
    const isSupported = await paymasterSupportsAddress({
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
