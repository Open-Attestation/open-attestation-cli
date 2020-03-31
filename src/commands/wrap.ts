import { Argv } from "yargs";
import { wrapWithDetailedError } from "../implementations/wrap";
import signale from "signale";

interface WrapCommand {
  unwrappedDir: string;
  wrappedDir: string;
  schema: any;
  openAttestationV3: boolean;
  unwrap: boolean;
}

export const command = "wrap <unwrapped-dir> <wrapped-dir> [schema]";

export const describe = "Wrap a directory of documents into a document batch";

export const builder = (yargs: Argv): Argv =>
  yargs
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

export const handler = async (args: WrapCommand): Promise<string> => {
  const merkleRoot = await wrapWithDetailedError(args.unwrappedDir, args.wrappedDir, {
    schemaPath: args.schema,
    version: args.openAttestationV3 ? "open-attestation/3.0" : "open-attestation/2.0",
    unwrap: args.unwrap
  });
  signale.success(`Batch Document Root: 0x${merkleRoot}`);
  return merkleRoot;
};

export default {
  command,
  describe,
  builder,
  handler
};
