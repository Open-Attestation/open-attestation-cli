import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreTransferOwnershipCommand } from "./document-store-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getErrorMessage, getEtherscanAddress, addAddressPrefix } from "../../utils";
import { grantDocumentStoreRole } from "../../implementations/document-store/grant-role";
import { revokeDocumentStoreRole } from "../../implementations/document-store/revoke-role";
import { getWalletOrSigner } from "../../implementations/utils/wallet";

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
    const account = addAddressPrefix(args.newOwner);
    const role = "admin";
    const { transactionHash: grantTransactionHash } = await grantDocumentStoreRole({
      ...args,
      // add 0x automatically in front of the hash if it's not provided
      account,
      role,
    });

    const wallet = await getWalletOrSigner({ ...args });
    const walletAddress = await wallet.getAddress();

    const { transactionHash: revokeTransactionHash } = await revokeDocumentStoreRole({
      ...args,
      account: addAddressPrefix(walletAddress),
      role,
    });

    success(`Ownership of document store ${args.address} has been transferred to new wallet ${args.newOwner}`);
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
