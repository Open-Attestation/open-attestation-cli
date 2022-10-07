import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../../logger";
import { TokenRegistryRoleCommand } from "../token-registry-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../../shared";
import { getErrorMessage, getEtherscanAddress } from "../../../utils";
import { getRoleEnumValue, getAllRolesInput } from "./helper";
import { revokeRoleToTokenRegistry } from "../../../implementations/token-registry/role/revoke-role";

const { trace } = getLogger("token-registry:revoke-role");

export const command = "revoke-role [options]";

export const describe = "Revoke User Role in Token Registry";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("address", {
          alias: "a",
          description: "Address of the token registry",
          type: "string",
          demandOption: true,
        })
        .option("role", {
          describe: "Role to be revoked from recipient",
          type: "string",
          nargs: 1,
          demandOption: true,
          choices: getAllRolesInput(),
        })
        .option("recipient", {
          description: "Recipient of the role revocation",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TokenRegistryRoleCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Revoking ${args.role} role from the recipient ${args.recipient} in the registry ${args.address}`);
    const { transactionHash } = await revokeRoleToTokenRegistry({
      ...args,
      role: getRoleEnumValue(args.role),
    });
    success(`Role ${args.role} has been revoked from the recipient ${args.recipient} in the registry ${args.address}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
