import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { DeployDocumentStoreCommand } from "./deploy.types";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress, highlight } from "../../utils";
import { NetworkCmdName } from "../../common/networks";

const { trace } = getLogger("deploy:document-store");

export const command = "document-store <store-name> [options]";

export const describe = "Deploys a document store contract on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs.positional("store-name", {
        description: "Name of the store",
        normalize: true,
      })
    ).option("owner", {
      alias: "o",
      description: "Document Store owner address. Default owner is deployer address.",
      type: "string",
      normalize: true,
    })
  );

export const handler = async (args: DeployDocumentStoreCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying document store ${args.storeName}`);
    const documentStore = await deployDocumentStore(args);
    const network = args.network as NetworkCmdName;

    displayTransactionPrice(documentStore, network);

    success(`Document store ${args.storeName} deployed at ${highlight(documentStore.contractAddress)}`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${documentStore.contractAddress}`
    );
    return documentStore.contractAddress;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
