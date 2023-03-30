import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { issueToTokenRegistry } from "../../implementations/token-registry/issue";
import { TokenRegistryIssueCommand } from "./token-registry-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getErrorMessage, getEtherscanAddress, addAddressPrefix } from "../../utils";

const { trace } = getLogger("token-registry:issue");

export const command = "issue [options]";

export const describe = "Issue a hash to a token registry deployed on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("address", {
          alias: "a",
          description: "Address of the token registry to issue the hash to",
          type: "string",
          demandOption: true,
        })
        .option("tokenId", {
          description: "Hash to add to the token registry",
          type: "string",
          demandOption: true,
        })
        .option("beneficiary", {
          description: "Initial beneficiary of the tokenId",
          type: "string",
          demandOption: true,
        })
        .option("holder", {
          description: "Initial holder of the tokenId",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TokenRegistryIssueCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(
      `Issuing ${args.tokenId} to the initial recipient ${args.beneficiary} and initial holder ${args.holder} in the registry ${args.address}`
    );
    const { transactionHash } = await issueToTokenRegistry({
      ...args,
      tokenId: addAddressPrefix(args.tokenId),
    });
    success(
      `Token with hash ${args.tokenId} has been issued on ${args.address} with the initial recipient being ${args.beneficiary} and initial holder ${args.holder}`
    );
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    return args.address;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
