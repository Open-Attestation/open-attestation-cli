import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "./title-escrow-command.type";
import { returnDocument } from "../../implementations/title-escrow/returnDocument";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";
import { NetworkCmdName } from "../../common/networks";

const { trace } = getLogger("title-escrow:return-document-to-issuer");

export const command = "return-document-to-issuer [options]";

export const describe = "Returns a document on the blockchain";

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
          description: "Remark for the return",
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
    info(`Returning document`);
    const transaction = await returnDocument(args);
    const network = args.network as NetworkCmdName;
    displayTransactionPrice(transaction, network);
    const { transactionHash } = transaction;
    success(`Transferable record with hash ${args.tokenId} has been returned.`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
