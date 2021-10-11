import { Argv } from "yargs";
import signale, { error, info } from "signale";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { CreateWalletCommand } from "./wallet.type";
import { create } from "../../implementations/wallet/create";

const { trace } = getLogger("wallet:create");

export const command = "create [options]";

export const describe = "Create a random wallet and encrypt the result into the provided path";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("output-file", {
      alias: "of",
      description: "Write output to a file",
      type: "string",
      demandOption: true,
    })
    .option("fund", {
      description: "Automatically add funds for the specified network",
      type: "string",
      choices: ["ropsten"],
    });

export const handler = async (args: CreateWalletCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Creating a new wallet`);
    const outputPath = await create(args);
    signale.success(`Wallet successfully saved into ${highlight(outputPath)}`);
  } catch (e) {
    if (e instanceof TypeError) {
      error(e.message);
    }
  }
};
