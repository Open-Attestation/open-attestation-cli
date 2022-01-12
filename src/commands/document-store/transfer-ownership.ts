import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreTransferOwnershipCommand } from "./document-store-command.type";
import { transferDocumentStoreOwnershipToWallet } from "../../implementations/document-store/transfer-ownership";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getEtherscanAddress, addAddressPrefix } from "../../utils";

const { trace } = getLogger("document-store:transfer-ownership");

export const command = "transfer-ownership [options]";

export const describe = "transfer-ownership of the document store to another wallet";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("address", {
          alias: "a",
          description: "Address of document store to be transferred",
          type: "string",
          demandOption: true,
        })
        .option("newOwner", {
          alias: "h",
          description: "Address of new wallet to transfer ownership to",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: DocumentStoreTransferOwnershipCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Transferring ownership to wallet ${args.newOwner}`);
    const { transactionHash } = await transferDocumentStoreOwnershipToWallet({
      ...args,
      // add 0x automatically in front of the hash if it's not provided
      newOwner: addAddressPrefix(args.newOwner),
    });
    success(`Ownership of document store ${args.address} has been transferred to new wallet ${args.newOwner}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    if (e instanceof Error) {
      error(e.message);
    } else {
      error(e);
    }
  }
};
