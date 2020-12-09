import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { removeTargetFromPaymaster } from "../../implementations/paymaster/removeTarget";
import { PaymasterRemoveTargetCommand } from "./paymaster-command.type";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("paymaster:remove-target");

export const command = "remove-target [options]";

export const describe = "Remove a contract from being paid by a paymaster deployed on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .option("targetAddress", {
          alias: "a",
          description: "Address of contract to revoke to paymaster",
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

export const handler = async (args: PaymasterRemoveTargetCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Revoking payment of contract ${args.targetAddress} from paymaster ${args.paymasterAddress}`);
    const { transactionHash } = await removeTargetFromPaymaster({
      ...args,
    });
    success(`Contract with address ${args.targetAddress} has been revoked on paymaster ${args.paymasterAddress}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(e.message);
  }
};
