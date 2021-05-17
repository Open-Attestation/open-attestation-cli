import { Argv } from "yargs";
import { error, info } from "signale";
import { getLogger } from "../../logger";
import { cancelTransaction } from "../../implementations/transaction/transaction";
import { TransactionCancelCommand } from "./transaction-command.type";
import { withNetworkAndKeyOption } from "../shared";

const { trace } = getLogger("transaction:cancel");

export const command = "cancel [options]";

export const describe = "Cancel pending transaction on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withNetworkAndKeyOption(
    yargs
      .option("nonce", {
        description: "Pending transaction nonce",
        type: "string",
        demandOption: true,
      })
      .option("gas", {
        description: "Require higher gas fee than the pending transaction",
        type: "string",
        demandOption: true,
      })
  );

export const handler = async (args: TransactionCancelCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    if (!args.encryptedWalletPath) {
      error(`Wallet file not provided, please provide your wallet path`);
      return;
    }
    info(`Wallet detected at ${args.encryptedWalletPath}`);
    await cancelTransaction({
      ...args,
    });
  } catch (e) {
    error(e.message);
  }
};
