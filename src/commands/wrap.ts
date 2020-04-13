import { Argv } from "yargs";
import { wrap } from "../implementations/wrap";
import { transformValidationErrors } from "../implementations/wrap/ajvErrorTransformer";

import signale from "signale";

interface WrapCommand {
  rawDocumentsPath: string;
  wrappedDocumentsDir: string;
  schema: any;
  openAttestationV3: boolean;
  unwrap: boolean;
}

export const command = "wrap <raw-documents-path> <wrapped-documents-dir> [schema]";

export const describe = "Wrap a directory of documents into a document batch";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("ents-path", {
      description: "Directory containing the unissued raw documents or a single raw document file",
      normalize: true,
      type: "string"
    })
    .positional("wrapped-documents-dir", {
      description: "Directory to output the wrapped documents to.",
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
    });

export const handler = async (args: WrapCommand): Promise<string> => {
  try {
    const merkleRoot = await wrap(args.rawDocumentsPath, args.wrappedDocumentsDir, {
      schemaPath: args.schema,
      version: args.openAttestationV3 ? "open-attestation/3.0" : "open-attestation/2.0",
      unwrap: args.unwrap
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
