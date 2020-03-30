#!/usr/bin/env node

import yargs, { Argv } from "yargs";
import { wrap, isWrapCommand } from "./wrap";
import { getLogger } from "./logger";
import { version } from "../package.json";
import signale from "signale";
import { transformValidationErrors } from "./errors";
import { encrypt, isEncryptCommand } from "./encrypt";
import { filter, isFilterCommand } from "./filter";

const logger = getLogger("main");

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseArguments = (argv: string[]) => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const wrapSubCommand = (sub: Argv) =>
    sub
      .positional("unwrapped-dir", {
        description: "Directory containing the raw unissued and unwrapped documents",
        normalize: true
      })
      .positional("wrapped-dir", {
        description: "Directory to output the wrapped documents to.",
        normalize: true
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
        description: "Use if raw directory contains wrapped files"
      });

  return yargs
    .version(version)
    .usage("Open Attestation document issuing, verification and revocation tool.")
    .strict()
    .epilogue("The common subcommands you might be interested in are:\n" + "- wrap\n" + "- filter\n" + "- encrypt")
    .command("filter <source> <destination> [fields..]", "Obfuscate fields in the document", (sub: Argv) =>
      sub
        .positional("source", {
          description: "Source wrapped document filename",
          normalize: true
        })
        .positional("destination", {
          description: "Destination to write obfuscated document file to",
          normalize: true
        })
    )
    .command(
      "wrap <unwrapped-dir> <wrapped-dir> [schema]",
      "Wrap a directory of documents into a document batch",
      wrapSubCommand
    )
    .command(
      "batch <unwrapped-dir> <wrapped-dir> [schema]",
      "[DEPRECATED] Wrap a directory of documents into a document batch",
      wrapSubCommand
    )
    .command(
      "encrypt <wrapped-file> <encrypted-file>",
      "Encrypt a document in order to share and store it safely",
      (sub: Argv) =>
        sub
          .positional("wrapped-file", {
            description: "Source wrapped document filename",
            normalize: true
          })
          .positional("encrypted-file", {
            description: "Destination to write encrypted document file to",
            normalize: true
          })
    )
    .parse(argv);
};

const main = async (argv: string[]): Promise<any> => {
  const args: { [key: string]: any } = parseArguments(argv);
  logger.debug(`Parsed args: ${JSON.stringify(args)}`);

  if (args._.length !== 1) {
    yargs.showHelp("log");
    return false;
  }

  if (args._[0] === "batch") {
    signale.warn("[deprecated] batch command has been deprecated in favor of wrap");
  }

  switch (true) {
    case isWrapCommand(args):
      const merkleRoot = await wrap(args.unwrappedDir, args.wrappedDir, {
        schemaPath: args.schema,
        version: args.openAttestationV3 ? "open-attestation/3.0" : "open-attestation/2.0",
        unwrap: args.unwrap
      });
      signale.success(`Batch Document Root: 0x${merkleRoot}`);
      return merkleRoot;
    case isFilterCommand(args):
      return filter(args.source, args.destination, args.fields);
    case isEncryptCommand(args):
      return encrypt(args.wrappedFile, args.encryptedFile);
    default:
      throw new Error(`Unknown command ${args._[0]}. Possible bug.`);
  }
};

if (typeof require !== "undefined" && require.main === module) {
  main(process.argv.slice(2))
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      logger.error(`Error executing: ${err}`);
      if (typeof err.stack !== "undefined") {
        logger.debug(err.stack);
      }
      for (const key in err) {
        logger.debug(JSON.stringify(err[key], undefined, 2));
      }
      logger.debug(JSON.stringify(err));
      signale.error(err.message);
      if (err.validationErrors) {
        const transformedErrors = transformValidationErrors(err.validationErrors);
        transformedErrors.map(error => signale.error(error));
      }
      signale.info("You can enable logging by adding DEBUG=open-attestation-cli:* to your command");
      signale.info("More info on debug: https://www.npmjs.com/package/debug");
      process.exit(1);
    });
}
