import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreTransferOwnershipCommand } from "./document-store-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getErrorMessage, getEtherscanAddress, addAddressPrefix } from "../../utils";
import { transferDocumentStoreOwnership } from "../../implementations/document-store/transfer-ownership";

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
          alias: ["h", "account"],
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
    const { address, newOwner } = args;
    const { grantTransaction, revokeTransaction } = await transferDocumentStoreOwnership({
      ...args,
      // add 0x automatically in front of the hash if it's not provided
      newOwner: addAddressPrefix(newOwner),
      address: addAddressPrefix(address),
    });

    const grantTransactionHash = (await grantTransaction).transactionHash;
    const revokeTransactionHash = (await revokeTransaction).transactionHash;

    success(`Ownership of document store ${args.address} has been transferred to wallet ${args.newOwner}`);

    info(
      `Find more details at ${getEtherscanAddress({
        network: args.network,
      })}/tx/${grantTransactionHash} (grant) and ${getEtherscanAddress({
        network: args.network,
      })}/tx/${revokeTransactionHash} (revoke)`
    );

    return args.address;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
