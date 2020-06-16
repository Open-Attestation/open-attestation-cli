import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { issueToTokenRegistry } from "../../implementations/token-registry/issue";
import { TokenRegistryIssueCommand } from "./token-registry-command.type";

const { trace } = getLogger("token-registry:issue");

export const command = "issue [options]";

export const describe = "Issue a hash to a token registry deployed on the blockchain";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("address", {
      alias: "a",
      description: "Address of the token registry to issue the hash to",
      type: "string",
      demandOption: true
    })
    .option("tokenId", {
      description: "Hash to add to the token registry",
      type: "string",
      demandOption: true
    })
    .option("to", {
      description: "Initial recipient of the tokenId",
      type: "string",
      demandOption: true
    })
    .option("network", {
      alias: "n",
      choices: ["mainnet", "ropsten"],
      default: "mainnet",
      description: "Ethereum network to deploy to"
    })
    .option("key", {
      alias: "k",
      type: "string",
      description: "Private key of owner account"
    })
    .option("key-file", {
      alias: "f",
      type: "string",
      description: "Path to file containing private key of owner account"
    });

export const handler = async (args: TokenRegistryIssueCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Issuing ${args.tokenId} to the initial recipient ${args.to} in the registry ${args.address}`);
    const { transactionHash } = await issueToTokenRegistry({
      ...args
    });
    success(
      `Token with hash ${args.tokenId} has been issued on ${args.address} with the initial recipient being ${args.to}`
    );
    info(
      `Find more details at https://${args.network === "ropsten" ? "ropsten." : ""}etherscan.io/tx/${transactionHash}`
    );
    return args.address;
  } catch (e) {
    error(e.message);
  }
};
