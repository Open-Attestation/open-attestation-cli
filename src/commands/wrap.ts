import { Argv } from "yargs";
import signale from "signale";
import { wrap } from "../implementations/wrap";
import { transformValidationErrors } from "../implementations/wrap/ajvErrorTransformer";
import { isDir, Output } from "../implementations/utils/disk";
import { SchemaId } from "@tradetrust-tt/tradetrust";

interface WrapCommand {
  rawDocumentsPath: string;
  outputDir?: string;
  outputFile?: string;
  schema?: string;
  openAttestationV3: boolean;
  unwrap: boolean;
  silent?: boolean;
  batched: boolean;
  dnsTxt?: string;
  documentStore?: string;
  templateUrl?: string;
}

export const command = "wrap <raw-documents-path> [options]";

export const describe = "Wrap a directory of documents into a document batch";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("raw-documents-path", {
      description: "Directory containing the unissued raw documents or a single raw document file",
      normalize: true,
      type: "string",
    })
    .option("schema", {
      alias: "s",
      description: "Path or URL to custom schema",
      type: "string",
    })
    .option("open-attestation-v2", {
      alias: "oav2",
      conflicts: "open-attestation-v3",
    })
    .option("open-attestation-v3", {
      alias: "oav3",
      conflicts: "open-attestation-v2",
    })
    .option("unwrap", {
      alias: "u",
      description: "Use if raw directory contains wrapped files",
      type: "boolean",
      default: false,
    })
    .option("output-file", {
      alias: "of",
      description: "Write output to a file. Only use when <wrapped-documents-dir> is a document",
      type: "string",
      conflicts: "output-dir",
    })
    .option("output-dir", {
      alias: "od",
      description: "Write output to a directory",
      type: "string",
      conflicts: "output-file",
    })
    .option("silent", {
      alias: "silent",
      description: "Disable console outputs when outputting to stdout",
      type: "boolean",
    })
    .option("batched", {
      description: "Indicate whether documents must be wrap together or individually",
      type: "boolean",
      default: true,
    })
    .option("dns-txt", {
      alias: "dt",
      description: "Add DNS-TXT proof to the document(s) to be wrapped",
      type: "string",
    })
    .option("document-store", {
      alias: "ds",
      description: "Add document store to proof of the document(s) to be wrapped",
      type: "string",
    })
    .option("template-url", {
      alias: "tu",
      description: "Add template url to document(s) to be wrapped",
      type: "string",
    });

export const handler = async (args: WrapCommand): Promise<string | undefined> => {
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

    // throw error when dns-txt is given, but document type is not oav3
    if (args.dnsTxt && !args.openAttestationV3) {
      signale.error("DNS-TXT proof can only be be added on v3 documents");
      process.exit(1);
    }

    // throw error when document store is given, but document type is not oav3
    if (args.documentStore && !args.openAttestationV3) {
      signale.error("Document store can only be added for v3 documents");
      process.exit(1);
    }

    // throw error when template-url is given, but document type is not oav3 file
    if (args.templateUrl && !args.openAttestationV3) {
      signale.error("Template url can only be added for v3 documents");
      process.exit(1);
    }

    // when outputting to stdout, disable signale so that the logs do not interfere
    if (args.silent) {
      signale.disable();
    }

    // if output to a file or stdout, we handle only one file. In that case we disable the batch mode
    const batched = outputPathType !== Output.Directory ? false : args.batched;
    if (!batched && args.batched) {
      signale.warn("Detected single file: batch mode disabled.");
    }

    const merkleRoot = await wrap({
      inputPath: args.rawDocumentsPath,
      outputPath,
      schemaPath: args.schema,
      version: args.openAttestationV3 ? SchemaId.v3 : SchemaId.v2,
      unwrap: args.unwrap,
      outputPathType,
      batched,
      dnsTxt: args.dnsTxt,
      documentStore: args.documentStore,
      templateUrl: args.templateUrl,
    });

    if (merkleRoot) {
      signale.success(`Batch Document Root: 0x${merkleRoot}`);
    } else {
      signale.success("All documents have been individually wrapped");
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
