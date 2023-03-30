import { Argv } from "yargs";
import { decrypt, DecryptCommand } from "../implementations/decrypt";

export const command = "decrypt <input> <output> <key>";

export const describe = "Decrypt a document encrypted with a key";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("input", {
      description: "Path for encrypted file",
      normalize: true,
    })
    .positional("output", {
      description: "Destination to write decrypted document file to",
      normalize: true,
    })
    .positional("key", {
      description: "Decryption key for encrypted file",
      normalize: true,
    });

export const handler = (args: DecryptCommand): void => {
  return decrypt(args);
};
