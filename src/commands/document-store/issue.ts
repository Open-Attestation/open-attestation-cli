import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { issueToDocumentStore } from "../../implementations/document-store/issue";
import { DocumentStoreIssueCommand } from "./document-store-command.type";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("document-store:issue");

export const command = "issue [options]";

export const describe = "Issue a hash to a document store deployed on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .option("address", {
          alias: "a",
          description: "Address to issue the hash to",
          type: "string",
          demandOption: true,
        })
        .option("hash", {
          alias: "h",
          description: "Hash to add to the document store",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: DocumentStoreIssueCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Issuing ${args.hash} to document store ${args.address}`);
    const { transactionHash } = await issueToDocumentStore({
      ...args,
      // add 0x automatically in front of the hash if it's not provided
      hash: args.hash.startsWith("0x") ? args.hash : `0x${args.hash}`,
    });
    success(`Document/Document Batch with hash ${args.hash} has been issued on ${args.address}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(e.message);
  }
};
