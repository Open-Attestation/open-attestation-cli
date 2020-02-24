#!/usr/bin/env node

import fs from "fs";
import yargs, { Argv } from "yargs";
import { obfuscateDocument, verifySignature } from "@govtechsg/open-attestation";
import { wrap } from "./wrap";
import { getLogger } from "./logger";
import { version } from "../package.json";
import signale from "signale";
import { transformValidationErrors } from "./errors";

interface WrapCommand {
  unwrappedDir: string;
  wrappedDir: string;
  schema: any;
  openAttestationV3: boolean;
  unwrap: boolean;
}

const isWrapCommand = (args: any): args is WrapCommand => {
  return args._[0] === "batch" || args._[0] === "wrap";
};

interface FilterCommand {
  source: string;
  destination: string;
  fields: string[];
}

const isFilterCommand = (args: any): args is FilterCommand => {
  return args._[0] === "filter";
};

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
    .epilogue("The common subcommands you might be interested in are:\n" + "- wrap\n" + "- filter")
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
      "Wrap a directory of documents into a document batch",
      wrapSubCommand
    )
    .parse(argv);
};

const obfuscate = (input: string, output: string, fields: string[]): void => {
  const documentJson = JSON.parse(fs.readFileSync(input, "utf8"));
  const obfuscatedDocument = obfuscateDocument(documentJson, fields);
  const isValid = verifySignature(obfuscatedDocument);

  if (!isValid) {
    throw new Error("Privacy filtering caused document to fail schema or signature validation");
  } else {
    fs.writeFileSync(output, JSON.stringify(obfuscatedDocument, null, 2));
    signale.success(`Obfuscated document saved to: ${output}`);
  }
};

const main = async (argv: string[]): Promise<any> => {
  const args = parseArguments(argv);
  logger.debug(`Parsed args: ${JSON.stringify(args)}`);

  if (args._.length !== 1) {
    yargs.showHelp("log");
    return false;
  }

  if (args._[0] === "batch") {
    signale.warn("[deprecated] batch command has been deprecated in favor of wrap");
  }

  if (isWrapCommand(args)) {
    return wrap(args.unwrappedDir, args.wrappedDir, {
      schemaPath: args.schema,
      version: args.openAttestationV3 ? "open-attestation/3.0" : "open-attestation/2.0",
      unwrap: args.unwrap
    }).then(merkleRoot => {
      signale.success(`Batch Document Root: 0x${merkleRoot}`);
      return `${merkleRoot}`;
    });
  } else if (isFilterCommand(args)) {
    return obfuscate(args.source, args.destination, args.fields);
  } else {
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
