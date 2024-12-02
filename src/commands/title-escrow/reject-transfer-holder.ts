import { Argv } from "yargs";
import { error, info, success, warn } from "signale";
import { getLogger } from "../../logger";
import { BaseTitleEscrowCommand as TitleEscrowRejectTransferCommand } from "./title-escrow-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";
import { NetworkCmdName } from "../../common/networks";
import { rejectTransferHolder } from "../../implementations/title-escrow/rejectTransferHolder";

const { trace } = getLogger("title-escrow:reject-transfer-of-holder");

export const command = "reject-transfer-holder [options]";

export const describe = "Reject the transfer of the holder of a transferable record";

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
        .option("remark", {
          alias: "remark",
          description: "Remark for the rejection",
          type: "string",
        })
        .option("encryptionKey", {
          alias: "encryptionKey",
          description: "Encryption key for the document",
          type: "string",
        })
    )
  );

export const handler = async (args: TitleEscrowRejectTransferCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(
      `Connecting to the registry ${args.tokenRegistry} and attempting to reject the change of holder of the transferable record ${args.tokenId} to previous holder`
    );
    warn(
      `Please note that if you do not have the correct privileges to the transferable record, then this command will fail.`
    );
    info("here");
    const transaction = await rejectTransferHolder(args);
    const network = args.network as NetworkCmdName;
    displayTransactionPrice(transaction, network);
    const { transactionHash } = transaction;
    success(`Transferable record with hash ${args.tokenId}'s holder has been successfully rejected to previous holder`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    console.log(e);
    error(getErrorMessage(e));
  }
};
