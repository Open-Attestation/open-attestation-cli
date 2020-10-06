import { Argv } from "yargs";
import { withPrivateKeyOption } from "./shared";
import signale from "signale";
import { sign, SignCommand, supportedAlgorithms } from "../implementations/sign";

export const command = "sign <raw-documents-path>";

export const describe = "Sign document(s) and appends proof block";

export const builder = (yargs: Argv): Argv =>
  withPrivateKeyOption(
    yargs
      .positional("raw-documents-path", {
        description: "Directory containing the unissued raw documents or a single raw document file",
        normalize: true,
        type: "string",
      })
      .option("output-dir", {
        alias: "od",
        description: "Write output to a directory",
        type: "string",
        required: true,
      })
      .option("public-key", {
        alias: "p",
        description: "Public key in did (ie did:ethr:0xE712878f6E8d5d4F9e87E10DA604F9cB564C9a89#controller)",
        type: "string",
        required: true,
      })
      .option("algorithm", {
        alias: "a",
        choices: supportedAlgorithms,
        default: "Secp256k1VerificationKey2018",
        description: "Algorithm to sign with",
      })
  );

export const handler = async (args: SignCommand): Promise<void> => {
  try {
    await sign(args);
    signale.success(`Signed documents saved to ${args.outputDir}`);
  } catch (err) {
    signale.error(err.message);
    process.exit(1);
  }
};
