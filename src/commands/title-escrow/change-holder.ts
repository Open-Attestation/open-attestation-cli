import { Argv } from "yargs";
import { error, info, success, warn } from "signale";
import { getLogger } from "../../logger";
import { changeHolderOfTitleEscrow } from "../../implementations/title-escrow/changeHolder";
import { TitleEscrowChangeHolderCommand } from "./title-escrow-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("title-escrow:change-holder");

export const command = "change-holder [options]";

export const describe = "Changes the holder of the transferable record to another address";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("token-registry", {
          alias: "tr",
          description: "Address of the token registry that the transferable record was issued from",
          type: "string",
          demandOption: true,
        })
        .option("tokenId", {
          description: "Merkle root (document hash) of the transferable record",
          type: "string",
          demandOption: true,
        })
        .option("to", {
          description: "Address of the new holder of the transferable record",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TitleEscrowChangeHolderCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(
      `Connecting to the registry ${args.tokenRegistry} and attempting to change the holder of the transferable record ${args.tokenId} to ${args.to}`
    );
    warn(
      `Please note that only current holders can change the holder of the transferable record, otherwise this command will fail.`
    );
    const { transactionHash } = await changeHolderOfTitleEscrow(args);
    success(
      `Transferable record with hash ${args.tokenId}'s holder has been successfully changed to holder with address: ${args.to}`
    );
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(e);
    if (e instanceof Error) {
      error(e.message);
    } else {
      error(e);
    }
  }
};
