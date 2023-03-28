import { Argv } from "yargs";
import signale from "signale";
import { unwrap } from "../implementations/unwrap";
import { isDir, Output } from "../implementations/utils/disk";
import { versionCheck } from "../implementations/utils/github-version";
interface UnwrapCommand {
  wrappedDocumentsPath: string;
  outputDir?: string;
  outputFile?: string;
  silent?: boolean;
}

export const command = "unwrap <wrapped-documents-path> [options]";

export const describe = "Unwrap a document";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("wrapped-documents-path", {
      description: "Directory containing the issued wrapped document or a single wrapped document file",
      normalize: true,
      type: "string",
    })
    .option("output-file", {
      alias: "of",
      description: "Write output to a file. Only use when <unwrapped-documents-dir> is a document",
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
    });

export const handler = async (args: UnwrapCommand): Promise<void | undefined> => {
  await versionCheck();
  try {
    const outputPathType = args.outputDir ? Output.Directory : args.outputFile ? Output.File : Output.StdOut;
    const outputPath = args.outputDir || args.outputFile; // undefined when we use std out

    // when input type is directory, output type must only be directory
    if (isDir(args.wrappedDocumentsPath) && outputPathType !== Output.Directory) {
      signale.error(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
      process.exit(1);
    }

    // when outputting to stdout, disable signale so that the logs do not interfere
    if (args.silent) {
      signale.disable();
    }

    const rawDocsCount = await unwrap({
      inputPath: args.wrappedDocumentsPath,
      outputPath,
      outputPathType,
    });

    if (rawDocsCount) {
      if (rawDocsCount > 1) {
        signale.success(`The documents have been individually unwrapped into folder ${outputPath}`);
      } else {
        signale.success(`The document has been unwrapped`);
      }
    }
  } catch (err) {
    signale.error(err.message);
    process.exit(1);
  }
};
