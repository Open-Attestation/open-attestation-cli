import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRoleCommand } from "./document-store-command.type";
import { grantDocumentStoreRole } from "../../implementations/document-store/grant-role";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getErrorMessage, getEtherscanAddress, addAddressPrefix } from "../../utils";
import { rolesList } from "../../implementations/document-store/document-store-roles";

const { trace } = getLogger("document-store:grant-role");

export const command = "grant-role [options]";

export const describe = "grant role of the document store to a wallet";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("address", {
          alias: "a",
          description: "Address of document store to be granted role",
          type: "string",
          demandOption: true,
        })
        .option("account", {
          alias: ["h", "newOwner"],
          description: "Address of wallet to transfer role to",
          type: "string",
          demandOption: true,
        })
        .option("role", {
          alias: "r",
          description: "Role to be transferred",
          type: "string",
          options: rolesList,
          demandOption: true,
        })
    )
  );

export const handler = async (args: DocumentStoreRoleCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Granting role to wallet ${args.account}`);
    const { transactionHash } = await grantDocumentStoreRole({
      ...args,
      // add 0x automatically in front of the hash if it's not provided
      account: addAddressPrefix(args.account),
    });
    success(`Document store ${args.address}'s role of: ${args.role} has been granted to wallet ${args.account}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
