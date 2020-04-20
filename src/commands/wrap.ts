import { Argv } from "yargs";
import { wrap, Output } from "../implementations/wrap";
import { transformValidationErrors } from "../implementations/wrap/ajvErrorTransformer";
import { isDir } from "../implementations/wrap/diskUtils";

import signale from "signale";

interface WrapCommand {
  rawDocumentsPath: string;
  schema: string;
  openAttestationV3: boolean;
  unwrap: boolean;
  outputFile: string;
  outputDir: string;
}

export const command = "wrap <raw-documents-path> [options]";

export const describe = "Wrap a directory of documents into a document batch";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("raw-documents-path", {
      description: "Directory containing the unissued raw documents or a single raw document file",
      normalize: true,
      type: "string"
    })
    .option("schema", {
      alias: "s",
      type: "string",
      description: "Path or URL to custom schema"
    })
    .option("open-attestation-v2", {
      alias: "oav2",
      conflicts: "open-attestation-v3"
    })
    .option("open-attestation-v3", {
      alias: "oav3",
      conflicts: "open-attestation-v2"
    })
    .option("unwrap", {
      alias: "u",
      description: "Use if raw directory contains wrapped files",
      type: "boolean",
      default: false
    })
    .option("output-file", {
      alias: "of",
      type: "string",
      description: "Write output to a file. Only use when <wrapped-documents-dir> is a document",
      conflicts: "output-dir"
    })
    .option("output-dir", {
      alias: "od",
      type: "string",
      description: "Write output to a directory",
      conflicts: "output-file"
    });

export const handler = async (args: WrapCommand): Promise<string> => {
  try {
    const outputPathType = args.outputDir ? Output.Directory : args.outputFile ? Output.File : Output.Stdout;
    const outputPath = args.outputDir || args.outputFile; // undefined when we use std out

    // when input type is directory, output type must only be directory
    if (isDir(args.rawDocumentsPath) && outputPathType !== Output.Directory) {
      signale.error(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
      process.exit(1);
    }

    const merkleRoot = await wrap(
      args.rawDocumentsPath,
      {
        schemaPath: args.schema,
        version: args.openAttestationV3 ? "open-attestation/3.0" : "open-attestation/2.0",
        unwrap: args.unwrap,
        outputPathType
      },
      outputPath
    );

    // Todo change to global mechanism to disable the logging based on a condition
    if (outputPathType !== Output.Stdout) {
      signale.success(`Batch Document Root: 0x${merkleRoot}`);
    }

    return merkleRoot;
  } catch (err) {
    signale.error(err.message);
    if (err.validationErrors) {
      for (const error of transformValidationErrors(err.validationErrors)) {
        signale.error(error);
      }
    }
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
