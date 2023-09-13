import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRoleCommand } from "./document-store-command.type";
import { revokeDocumentStoreRole } from "../../implementations/document-store/revoke-role";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getErrorMessage, getEtherscanAddress, addAddressPrefix } from "../../utils";
import { rolesList } from "../../implementations/document-store/document-store-roles";

const { trace } = getLogger("document-store:revoke-role");

export const command = "revoke-role [options]";

export const describe = "revoke role of the document store to a wallet";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("address", {
          alias: "a",
          description: "Address of document store to be revoked role",
          type: "string",
          demandOption: true,
        })
        .option("account", {
          alias: ["h", "newOwner"],
          description: "Address of wallet to revoke role from",
          type: "string",
          demandOption: true,
        })
        .option("role", {
          alias: "r",
          description: "Role to be revoked",
          type: "string",
          options: rolesList,
          demandOption: true,
        })
    )
  );

export const handler = async (args: DocumentStoreRoleCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Revoking role from wallet ${args.account}`);
    const { transactionHash } = await revokeDocumentStoreRole({
      ...args,
      // add 0x automatically in front of the hash if it's not provided
      account: addAddressPrefix(args.account),
    });
    success(`Document store ${args.address}'s role of: ${args.role} has been revoked from wallet ${args.account}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
