import signale, { error, info } from "signale";
import { Argv } from "yargs";
import { create } from "../../implementations/wallet/create";
import { getLogger } from "../../logger";
import { getErrorMessage, highlight } from "../../utils";
import { CreateWalletCommand } from "./wallet.type";

const { trace } = getLogger("wallet:create");

export const command = "create [options]";

export const describe = "Create a random wallet and encrypt the result into the provided path";

export const builder = (yargs: Argv): Argv =>
  yargs.option("output-file", {
    alias: "of",
    description: "Write output to a file",
    type: "string",
    demandOption: true,
  });

export const handler = async (args: CreateWalletCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Creating a new wallet`);
    const outputPath = await create(args);
    signale.success(`Wallet successfully saved into ${highlight(outputPath)}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
