import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { readFile } from "../../implementations/utils/disk";
// import { issueToTokenRegistry } from "../../implementations/token-registry/issue";
import { TransactionCancelCommand } from "./transaction-command.type";
import { withNetworkAndKeyOption } from "../shared";
// import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("transaction:cancel");

export const command = "cancel [options]";

export const describe = "Cancel pending transaction on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withNetworkAndKeyOption(
    yargs
      .option("nonce", {
        description: "Pending transaction nonce",
        type: "string",
        demandOption: true,
      })
      .option("gas", {
        description: "Require higher gas fee than the pending transaction",
        type: "string",
        demandOption: true,
      })
  );

export const handler = async (args: TransactionCancelCommand): Promise<void> => {
  //   console.log(`Args: ${JSON.stringify(args, null, 2)}`);
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    if (!args.encryptedWalletPath) {
      error(`Wallet file not provided, please provide your wallet path`);
      return;
    }
    const wallet = await readFile(args.encryptedWalletPath);
    const walletObject = JSON.parse(wallet);
    info(`Wallet detected at ${args.encryptedWalletPath}`);
    walletObject.address;
    // info(`Cancelling pending transaction in ${args.encryptedWalletPath} to the initial recipient ${args.to} in the registry ${args.address}`);
    // const { transactionHash } = await issueToTokenRegistry({
    //   ...args,
    // });
    // success(
    //   `Token with hash ${args.tokenId} has been issued on ${args.address} with the initial recipient being ${args.to}`
    // );
    // info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
    // return args.address;
  } catch (e) {
    error(e.message);
  }
};
