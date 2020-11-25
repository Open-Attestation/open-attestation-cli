import { Argv } from "yargs";
import signale, { error } from "signale";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { DecryptWalletCommand } from "./wallet.type";
import { getWallet } from "../../implementations/utils/wallet";
import inquirer from "inquirer";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";

const { trace } = getLogger("wallet:decrypt");

export const command = "decrypt <input-file>";

export const describe = "Decrypt a wallet to get information about it. Some information might be sensitive";

export const builder = (yargs: Argv): Argv =>
  yargs.positional("input-file", {
    description: "Path to the wallet",
    normalize: true,
  });

export const handler = async (args: DecryptWalletCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    const name = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], separator: "-" });
    signale.warn(
      `You are about to reveal the private key of your wallet. Please type the following word into the terminal to prove that you understand the risks: ${name}`
    );
    const { ack } = await inquirer.prompt({
      name: "ack",
    });
    if (ack !== name) {
      signale.error("Incorrect acknowledgement of risks.");
      return;
    }
    signale.info("User consented to risks");

    const wallet = await getWallet({ encryptedWalletPath: args.inputFile });
    signale.success(`Wallet information:
- address: ${highlight(wallet.address)}
- public key: ${highlight(wallet.publicKey)}
- private key ${highlight(wallet.privateKey)}
`);
  } catch (e) {
    error(e.message);
  }
};
