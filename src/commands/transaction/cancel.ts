import { Argv } from "yargs";
import { error } from "signale";
import { getLogger } from "../../logger";
import { cancelTransaction } from "../../implementations/transaction/transaction";
import { TransactionCancelCommand } from "./transaction-command.type";
import { withNetworkAndWalletSignerOption } from "../shared";

const { trace } = getLogger("transaction:cancel");

export const command = "cancel [options]";

export const describe = "Cancel pending transaction on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withNetworkAndWalletSignerOption(
    yargs
      .option("nonce", {
        description: "Pending transaction nonce",
        type: "string",
        implies: "gas-price",
        conflicts: "transaction-hash",
      })
      .option("gas-price", {
        description: "Require higher gas fee than the pending transaction",
        type: "string",
        implies: "nonce",
        conflicts: "transaction-hash",
      })
      .option("transaction-hash", {
        alias: "th",
        description: "Pending transaction hash",
        type: "string",
      })
  );

export const handler = async (args: TransactionCancelCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    await cancelTransaction(args);
  } catch (e) {
    error(e.message);
  }
};
