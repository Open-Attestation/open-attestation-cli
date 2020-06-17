import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { revokeToDocumentStore } from "../../implementations/document-store/revoke";
import { DocumentStoreRevokeCommand } from "./document-store-command.type";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("document-store:revoke");

export const command = "revoke [options]";

export const describe = "Revoke a hash to a document store deployed on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .option("address", {
          alias: "a",
          description: "Address to revoke the hash to",
          type: "string",
          demandOption: true
        })
        .option("hash", {
          alias: "h",
          description: "Hash to revoke in the document store",
          type: "string",
          demandOption: true
        })
    )
  );

export const handler = async (args: DocumentStoreRevokeCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Revoking ${args.hash} to document store ${args.address}`);
    const { transactionHash } = await revokeToDocumentStore({
      ...args,
      // add 0x automatically in front of the hash if it's not provided
      hash: args.hash.startsWith("0x") ? args.hash : `0x${args.hash}`
    });
    success(`Document/Document Batch with hash ${args.hash} has been revoked on ${args.address}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(e.message);
  }
};
