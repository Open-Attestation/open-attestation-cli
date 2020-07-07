import { Argv } from "yargs";
import { encrypt } from "../implementations/encrypt";

export interface EncryptCommand {
  wrappedFile: string;
  encryptedFile: string;
}

export const command = "encrypt <wrapped-file> <encrypted-file>";

export const describe = "Encrypt a document in order to share and store it safely";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("wrapped-file", {
      description: "Source wrapped document filename",
      normalize: true,
    })
    .positional("encrypted-file", {
      description: "Destination to write encrypted document file to",
      normalize: true,
    });

export const handler = (args: EncryptCommand): void => {
  return encrypt(args.wrappedFile, args.encryptedFile);
};
