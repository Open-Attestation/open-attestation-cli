import { Argv } from "yargs";
import { error, info, success, warn } from "signale";
import { getLogger } from "../../logger";
import { nominateChangeOfOwner } from "../../implementations/title-escrow/nominateChangeOfOwner";
import { TitleEscrowNominateChangeOfOwnerCommand } from "./title-escrow-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("title-escrow:nominate-change-of-owner");

export const command = "nominate-change-owner [options]";

export const describe = "Nominates the change of owner of transferable record to another address";

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
        .option("newOwner", {
          description: "Address of the new owner of the transferable record",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TitleEscrowNominateChangeOfOwnerCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(
      `Connecting to the registry ${args.tokenRegistry} and attempting to nominate the change of owner of the transferable record ${args.tokenId} to new owner at ${args.newOwner}`
    );
    warn(
      `Please note that if you do not have the correct privileges to the transferable record, then this command will fail.`
    );
    const { transactionHash } = await nominateChangeOfOwner(args);
    success(
      `Transferable record with hash ${args.tokenId}'s holder has been successfully nominated to new owner with address ${args.newOwner}`
    );
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(e);
    error(e.message);
  }
};
