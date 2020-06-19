import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { DeployDocumentStoreCommand } from "./deploy.types";
import { withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("deploy:document-store");

export const command = "document-store <store-name> [options]";

export const describe = "Deploys a document store contract on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withNetworkAndKeyOption(
    yargs.positional("store-name", {
      description: "Name of the store",
      normalize: true
    })
  );

export const handler = async (args: DeployDocumentStoreCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying document store ${args.storeName}`);
    const documentStore = await deployDocumentStore(args);
    success(`Document store ${args.storeName} deployed at ${documentStore.contractAddress}`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${documentStore.contractAddress}`
    );
    return documentStore.contractAddress;
  } catch (e) {
    error(e.message);
  }
};
