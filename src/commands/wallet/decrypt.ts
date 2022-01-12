import { Argv } from "yargs";
import signale, { error } from "signale";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { DecryptWalletCommand } from "./wallet.type";
import { getWalletOrSigner } from "../../implementations/utils/wallet";
import inquirer from "inquirer";

const { trace } = getLogger("wallet:decrypt");

export const command = "decrypt <input-file>";

export const describe = "Decrypt a wallet to get information about it. Some information might be sensitive";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("input-file", {
      description: "Path to the wallet",
      normalize: true,
    })
    .option("yes", {
      alias: ["y", "yeh"],
      describe: "Consent to the risk automatically",
      default: false,
      type: "boolean",
    });

export const handler = async (args: DecryptWalletCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    if (!args.yes) {
      signale.warn(
        `You are about to reveal the private key of your wallet. Please type "yes" (without quotes) into the terminal to prove that you understand the risks`
      );
      const { ack } = await inquirer.prompt({
        name: "ack",
      });
      if (ack !== "yes") {
        signale.error("Incorrect acknowledgement of risks.");
        return;
      }
    }
    signale.info("User consented to risks");

    const wallet = await getWalletOrSigner({ encryptedWalletPath: args.inputFile });
    signale.success(`Wallet information:
- address: ${highlight(await wallet.getAddress())}
- public key: ${highlight(wallet.publicKey)}
- private key ${highlight(wallet.privateKey)}
`);
  } catch (e) {
    if (e instanceof Error) {
      error(e.message);
    } else {
      error(e);
    }
  }
};
