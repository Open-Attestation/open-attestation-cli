import { Argv } from "yargs";
import { wrap } from "../implementations/wrap";
import { transformValidationErrors } from "../implementations/wrap/ajvErrorTransformer";
import { isDir } from "../implementations/wrap/diskUtils";

import signale from "signale";

interface WrapCommand {
  rawDocumentsPath: string;
  wrappedDocumentsPath: string;
  schema: any;
  openAttestationV3: boolean;
  unwrap: boolean;
  outputFile: boolean;
  outputDir: boolean;
}

export const command = "wrap <raw-documents-path> <wrapped-documents-path> [schema]";

export const describe = "Wrap a directory of documents into a document batch";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("raw-documents-path", {
      description: "Directory containing the unissued raw documents or a single raw document file",
      normalize: true,
      type: "string"
    })
    .positional("wrapped-documents-path", {
      description: "Directory to output the wrapped documents to or single output file",
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
      description: "Use if output path is a file",
      conflicts: "output-dir"
    })
    .option("output-dir", {
      alias: "od",
      description: "Use if output path is a directory",
      conflicts: "output-file"
    });

export const handler = async (args: WrapCommand): Promise<string> => {
  try {
    // when input type is directory, output type must only be directory
    const outputPathType = args.outputDir ? "directory" : args.outputFile ? "file" : null; //default null
    if (isDir(args.rawDocumentsPath) && outputPathType !== "directory") {
      signale.error(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
      process.exit(1);
    }

    const merkleRoot = await wrap(args.rawDocumentsPath, args.wrappedDocumentsPath, {
      schemaPath: args.schema,
      version: args.openAttestationV3 ? "open-attestation/3.0" : "open-attestation/2.0",
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
