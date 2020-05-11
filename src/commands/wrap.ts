import { Argv } from "yargs";
import signale from "signale";
import { Output, wrap } from "../implementations/wrap";
import { transformValidationErrors } from "../implementations/wrap/ajvErrorTransformer";
import { isDir } from "../implementations/wrap/diskUtils";
import { SchemaId } from "@govtechsg/open-attestation";

interface WrapCommand {
  rawDocumentsPath: string;
  outputDir?: string;
  outputFile?: string;
  schema?: string;
  openAttestationV3: boolean;
  unwrap: boolean;
  silent?: boolean;
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
      description: "Path or URL to custom schema",
      type: "string"
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
    .option("silent", {
      alias: "silent",
      description: "Disable console outputs when outputting to stdout",
      type: "boolean"
    });

export const handler = async (args: WrapCommand): Promise<string> => {
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

    // when outputting to stdout, disable signale so that the logs do not interfere
    if (args.silent) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      signale.disable();
    }

    const merkleRoot = await wrap({
      inputPath: args.rawDocumentsPath,
      outputPath,
      schemaPath: args.schema,
      version: args.openAttestationV3 ? SchemaId.v3 : SchemaId.v2,
      unwrap: args.unwrap,
      outputPathType
    });

    signale.success(`Batch Document Root: 0x${merkleRoot}`);

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
