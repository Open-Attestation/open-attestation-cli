import { Argv } from "yargs";
import signale, { error } from "signale";
import { getLogger } from "../../logger";
import { getErrorMessage, highlight } from "../../utils";
import { withPrivateKeyOption } from "../shared";
import { EncryptWalletCommand } from "./wallet.type";
import { encrypt } from "../../implementations/wallet/encrypt";

const { trace } = getLogger("wallet:encrypt");

export const command = "encrypt [options]";

export const describe = "Encrypt a wallet using the provided private key";

export const builder = (yargs: Argv): Argv =>
  withPrivateKeyOption(
    yargs.option("output-file", {
      alias: "of",
      description: "Write output to a file",
      type: "string",
      demandOption: true,
    })
  );

export const handler = async (args: EncryptWalletCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    const outputPath = await encrypt(args);
    signale.success(`Wallet successfully saved into ${highlight(outputPath)}`);
  } catch (e) {
    error(await getErrorMessage(e));
  }
};
