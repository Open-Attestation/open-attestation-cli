import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { setPaymasterForGsnCapableContract } from "../../implementations/gsn-capable/setPaymaster";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";
import { GsnCapableSetPaymasterCommand } from "./gsn-capable-command.type";

const { trace } = getLogger("gsn-capable:set-paymaster");

export const command = "set-paymaster [options]";

export const describe = "Declare paymaster address to request payment from";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .option("gsnCapableAddress", {
          alias: "a",
          description: "Address to set paymaster address for",
          type: "string",
          demandOption: true,
        })
        .option("paymasterAddress", {
          alias: "p",
          description: "Paymaster address to set",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: GsnCapableSetPaymasterCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Setting paymaster ${args.paymasterAddress} for gsn capable contract ${args.gsnCapableAddress}`);
    const { transactionHash } = await setPaymasterForGsnCapableContract({
      ...args,
    });
    success(`Paymaster address ${args.paymasterAddress} has been successfully set on ${args.gsnCapableAddress}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(e.message);
  }
};
