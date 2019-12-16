import fs from "fs";
import mkdirp from "mkdirp";
import yargs, { Argv } from "yargs";
import { obfuscateDocument, verifySignature } from "@govtechsg/open-attestation";
import { batchIssue } from "./batchIssue";
import { getLogger } from "./logger";
import { version } from "../package.json";
const logger = getLogger("main");
import signale from "signale";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseArguments = (argv: string[]) =>
  yargs
    .version(version)
    .usage("Open Attestation document issuing, verification and revocation tool.")
    .strict()
    .epilogue("The common subcommands you might be interested in are:\n" + "- batch\n" + "- filter")
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
      "batch <raw-dir> <batched-dir> [schema]",
      "Combine a directory of documents into a document batch",
      (sub: Argv) =>
        sub
          .positional("raw-dir", {
            description: "Directory containing the raw unissued and unwrapped documents",
            normalize: true
          })
          .positional("batched-dir", {
            description: "Directory to output the batched documents to.",
            normalize: true
          })
          .positional("schema", {
            description: "Path or URL to custom schema"
          })
    )
    .parse(argv);

const batch = async (raw: string, batched: string, schemaPath?: string): Promise<string | void> => {
  mkdirp.sync(batched);
  return batchIssue(raw, batched, schemaPath).then(merkleRoot => {
    signale.success(`Batch Document Root: 0x${merkleRoot}`);
    return `${merkleRoot}`;
  });
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
  switch (args._[0]) {
    case "batch":
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return batch(args.rawDir, args.batchedDir, args.schema);
    case "filter":
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return obfuscate(args.source, args.destination, args.fields);
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
      signale.info("You can enable logging by adding DEBUG=open-attestation-cli:* to your command");
      signale.info("More info on debug: https://www.npmjs.com/package/debug");
      process.exit(1);
    });
}
