import { Argv } from "yargs";
import { error, info, success, warn } from "signale";
import { getLogger } from "../../logger";
import { endorseNominatedBeneficiary } from "../../implementations/title-escrow/endorseNominatedBeneficiary";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";
import { NetworkCmdName } from "../../common/networks";

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
        .option("newBeneficiary", {
          alias: ["to", "newOwner"],
          description: "Address of the beneficiary of the transferable record",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TitleEscrowNominateBeneficiaryCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(
      `Connecting to the registry ${args.tokenRegistry} and attempting to endorse the change of owner of the transferable record ${args.tokenId} to approved owner and approved holder`
    );
    warn(
      `Please note that if you do not have the correct privileges to the transferable record, then this command will fail.`
    );
    const { transactionReceipt } = await endorseNominatedBeneficiary(args);
    const network = args.network as NetworkCmdName;

    displayTransactionPrice(transactionReceipt, network);

    const { transactionHash } = transactionReceipt;
    success(
      `Transferable record with hash ${args.tokenId}'s holder has been successfully endorsed to approved beneficiary at ${args.newBeneficiary}`
    );
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
