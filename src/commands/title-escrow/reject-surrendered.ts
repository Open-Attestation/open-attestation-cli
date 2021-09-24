import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "./title-escrow-command.type";
import { rejectSurrendered } from "../../implementations/title-escrow/rejectSurrendered";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("title-escrow:reject-surrendered");

export const command = "reject-surrendered [options]";

export const describe = "Rejects a surrendered transferable record on the blockchain";

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
    info(`Rejecting surrendered document`);
    const transaction = await rejectSurrendered(args);
    success(`Surrendered transferable record with hash ${args.tokenId} has been rejected.`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transaction.transactionHash}`);
  } catch (e) {
    if (e instanceof TypeError) {
      error(e.message);
    }
  }
};
