import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "./title-escrow-command.type";
import { surrenderDocument } from "../../implementations/title-escrow/surrenderDocument";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("title-escrow:surrender-document");

export const command = "surrender [options]";

export const describe = "Surrenders a document on the blockchain";

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
          description: "Hash of document to surrender",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TitleEscrowSurrenderDocumentCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Surrendering document`);
    const transaction = await surrenderDocument(args);
    success(`Transferable record with hash ${args.tokenId} has been surrendered.`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transaction.transactionHash}`);
  } catch (e) {
    error(e.message);
  }
};
