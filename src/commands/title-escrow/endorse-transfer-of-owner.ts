import { Argv } from "yargs";
import { error, info, success, warn } from "signale";
import { getLogger } from "../../logger";
import { endorseTransferOfOwner } from "../../implementations/title-escrow/endorseTransferOfOwner";
import { BaseTitleEscrowCommand as TitleEscrowEndorseTransferOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("title-escrow:endorse-transfer-of-owner");

export const command = "endorse-transfer-owner [options]";

export const describe =
  "Endorses the transfer of owner of transferable record to an approved owner and approved holder address";

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
    )
  );

export const handler = async (args: TitleEscrowEndorseTransferOfOwnerCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(
      `Connecting to the registry ${args.tokenRegistry} and attempting to endorse the change of owner of the transferable record ${args.tokenId} to approved owner and approved holder`
    );
    warn(
      `Please note that if you do not have the correct privileges to the transferable record, then this command will fail.`
    );
    const { transactionReceipt, approvedHolder, approvedOwner } = await endorseTransferOfOwner(args);
    success(
      `Transferable record with hash ${args.tokenId}'s holder has been successfully endorsed to approved owner at ${approvedOwner}  and approved holder at ${approvedHolder}`
    );
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionReceipt.transactionHash}`
    );
  } catch (e) {
    error(e);
    if (e instanceof TypeError) {
      error(e.message);
    }
  }
};
