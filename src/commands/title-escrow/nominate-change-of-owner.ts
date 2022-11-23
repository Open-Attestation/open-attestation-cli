import { Argv } from "yargs";
import { error, info, success, warn } from "signale";
import { getLogger } from "../../logger";
import { nominateBeneficiary } from "../../implementations/title-escrow/nominateBeneficiary";
import { TitleEscrowNominateBeneficiaryCommand } from "./title-escrow-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";

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
        .option("newBeneficiary", {
          alias: "newOwner",
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
      `Connecting to the registry ${args.tokenRegistry} and attempting to nominate the change of owner of the transferable record ${args.tokenId} to new owner at ${args.newBeneficiary}`
    );
    warn(
      `Please note that if you do not have the correct privileges to the transferable record, then this command will fail.`
    );
    const transaction = await nominateBeneficiary(args);
    displayTransactionPrice(transaction);
    const { transactionHash } = transaction;
    success(
      `Transferable record with hash ${args.tokenId}'s holder has been successfully nominated to new owner with address ${args.newBeneficiary}`
    );
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
