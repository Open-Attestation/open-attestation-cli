import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { deployGsnCapableDocumentStore } from "../../implementations/deploy/gsn-capable-document-store";
import { DeployGsnCapableDocumentStoreCommand } from "./deploy.types";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("deploy:gsn-capable-document-store");

export const command = "gsn-capable-document-store <store-name> <trust-forwarder-address> [options]";

export const describe = "Deploys a gsn capable document store contract on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .positional("store-name", {
          description: "Name of the store",
        })
        .positional("trust-forwarder-address", {
          description:
            "Address of trust forwarder provider by OpenGsn to verify the signature and nonce of the original sender.",
        })
    )
  );

export const handler = async (args: DeployGsnCapableDocumentStoreCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying gsn capable document store ${args.storeName} with forwarder ${args.trustForwarderAddress}`);
    const gsnCapableDocumentStore = await deployGsnCapableDocumentStore(args);
    success(`Gsn document store ${args.storeName} deployed at ${gsnCapableDocumentStore.contractAddress}`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${
        gsnCapableDocumentStore.contractAddress
      }`
    );
    return gsnCapableDocumentStore.contractAddress;
  } catch (e) {
    error(e.message);
  }
};
