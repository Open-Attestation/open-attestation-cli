import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { DeployDocumentStoreCommand } from "./deploy.types";

const { trace } = getLogger("deploy:document-store");

export const command = "document-store <store-name> [options]";

export const describe = "Deploys a document store contract on the blockchain";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("store-name", {
      description: "Name of the store",
      normalize: true
    })
    .option("network", {
      alias: "n",
      choices: ["mainnet", "ropsten"],
      default: "mainnet",
      description: "Ethereum network to deploy to"
    })
    .option("key", {
      alias: "k",
      type: "string",
      description: "Private key of owner account"
    })
    .option("key-file", {
      alias: "f",
      type: "string",
      description: "Path to file containing private key of owner account"
    });

export const handler = async (args: DeployDocumentStoreCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying document store ${args.storeName}`);
    const documentStore = await deployDocumentStore(args);
    success(`Document store ${args.storeName} deployed at ${documentStore.contractAddress}`);
    info(
      `Find more details at https://${args.network === "ropsten" ? "ropsten." : ""}etherscan.io/address/${
        documentStore.contractAddress
      }`
    );
    return documentStore.contractAddress;
  } catch (e) {
    error(e.message);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
