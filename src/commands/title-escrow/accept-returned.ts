import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "./title-escrow-command.type";
import { acceptReturned } from "../../implementations/title-escrow/acceptReturned";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";
import { NetworkCmdName } from "../../common/networks";

const { trace } = getLogger("title-escrow:accept-returned");

export const command = "accept-returned [options]";

export const describe = "Accepts a returned transferable record on the blockchain";

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
          description: "Hash of document that was returned",
          type: "string",
          demandOption: true,
        })
        .option("remark", {
          alias: "remark",
          description: "Remark for the acceptance",
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
    info(`Accepting returned document`);
    const transaction = await acceptReturned(args);
    const network = args.network as NetworkCmdName;
    displayTransactionPrice(transaction, network);

    const { transactionHash } = transaction;
    success(`Returned transferable record with hash ${args.tokenId} has been accepted.`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
