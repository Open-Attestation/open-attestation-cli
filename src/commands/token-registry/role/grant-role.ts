import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../../logger";
import { grantRoleToTokenRegistry } from "../../../implementations/token-registry/role/grant-role";
import { TokenRegistryRoleCommand } from "../token-registry-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../../shared";
import { getErrorMessage, getEtherscanAddress } from "../../../utils";
import { getAllRolesInput, getRoleEnumValue } from "./helper";

const { trace } = getLogger("token-registry:grant-roles");

export const command = "grant-role [options]";

export const describe = "Grant Role of Token Registry";

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
          describe: "Role to be granted to recipient",
          type: "string",
          nargs: 1,
          demandOption: true,
          choices: getAllRolesInput(),
        })
        .option("recipient", {
          description: "Recipient of the role",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TokenRegistryRoleCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Assigning ${args.role} to the recipient ${args.recipient} in the registry ${args.address}`);
    const { transactionHash } = await grantRoleToTokenRegistry({
      ...args,
      role: getRoleEnumValue(args.role),
    });
    success(`Role ${args.role} has been assigned to the recipient ${args.recipient} in the registry ${args.address}`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
