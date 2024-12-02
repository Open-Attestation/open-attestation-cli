import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "./title-escrow-command.type";
import { rejectReturned } from "../../implementations/title-escrow/rejectReturned";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";
import { NetworkCmdName } from "../../common/networks";

const { trace } = getLogger("title-escrow:reject-returned");

export const command = "reject-returned [options]";

export const describe = "Rejects a returned transferable record on the blockchain";

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
          description: "Hash of document to return",
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

export const handler = async (args: TitleEscrowReturnDocumentCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Rejecting returned document`);
    const transaction = await rejectReturned(args);
    const network = args.network as NetworkCmdName;
    displayTransactionPrice(transaction, network);

    const { transactionHash } = transaction;
    success(`Returned transferable record with hash ${args.tokenId} has been rejected.`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
