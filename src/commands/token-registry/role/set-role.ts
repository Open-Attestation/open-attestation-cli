import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../../logger";
import { TokenRegistrySetRoleCommand } from "../token-registry-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../../shared";
import { getErrorMessage, getEtherscanAddress } from "../../../utils";
import { getRoleEnumValue, normalRolesInput, adminRolesInput } from "./helper";
import { setRoleToTokenRegistry } from "../../../implementations/token-registry/role/set-role";

const { trace } = getLogger("token-registry:set-roles");

export const command = "set-role [options]";

export const describe = "Set Role of Token Registry";

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
          describe: "Role to be set",
          type: "string",
          nargs: 1,
          demandOption: true,
          choices: normalRolesInput,
        })
        .option("adminRole", {
          describe: "Role to be set to Admin Role",
          type: "string",
          nargs: 1,
          demandOption: true,
          choices: adminRolesInput,
        })
    )
  );

export const handler = async (args: TokenRegistrySetRoleCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Setting ${args.adminRole} to the recipient role ${args.role} in the registry ${args.address}`);
    const { transactionHash } = await setRoleToTokenRegistry({
      ...args,
      role: getRoleEnumValue(args.role),
      adminRole: getRoleEnumValue(args.adminRole),
    });
    success(`Role ${args.adminRole} has been assigned to the recipient ${args.role} in the registry ${args.address}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
