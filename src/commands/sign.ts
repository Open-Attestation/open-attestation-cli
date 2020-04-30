import { Argv } from "yargs";
import signale from "signale";
import { sign, Output } from "../implementations/sign";
import { isDir } from "../implementations/utils/disk";

export const command = "sign <raw-documents-path>";

export const describe = "Sign document(s) and appends proof block";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("raw-documents-path", {
      description: "Directory containing the unissued raw documents or a single raw document file",
      normalize: true,
      type: "string"
    })
    .option("output-file", {
      alias: "of",
      description: "Write output to a file. Only use when <wrapped-documents-dir> is a document",
      type: "string",
      conflicts: "output-dir"
    })
    .option("output-dir", {
      alias: "od",
      description: "Write output to a directory",
      type: "string",
      conflicts: "output-file"
    })
    .option("private-key", {
      description: "Private key to sign document(s) with",
      type: "string"
    })
    .option("public-key", {
      description: "Public key to sign document(s) with",
      type: "string"
    });

export interface SignCommand {
  rawDocumentsPath: string;
  outputDir?: string;
  outputFile?: string;
  privateKey: string;
  publicKey: string;
}

export const handler = async (args: SignCommand): Promise<void> => {
  try {
    const outputPathType = args.outputDir ? Output.Directory : args.outputFile ? Output.File : Output.StdOut;
    const outputPath = args.outputDir || args.outputFile; // undefined when we use std out

    // when input type is directory, output type must only be directory
    if (isDir(args.rawDocumentsPath) && outputPathType !== Output.Directory) {
      signale.error(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
      process.exit(1);
    }

    if (!outputPath) {
      signale.error("An output path type must be chosen, use either --output-dir or --output-file");
      process.exit(1);
    } else {
      await sign({
        rawDocumentsPath: args.rawDocumentsPath,
        outputPath,
        outputPathType,
        privateKey: args.privateKey,
        publicKey: args.publicKey
      });
      signale.success(`Proof block appended`);
    }
  } catch (err) {
    signale.error(err.message);
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
