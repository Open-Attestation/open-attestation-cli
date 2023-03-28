import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "./title-escrow-command.type";
import { acceptSurrendered } from "../../implementations/title-escrow/acceptSurrendered";
import { getErrorMessage, getEtherscanAddress } from "../../utils";
import { versionCheck } from "../../implementations/utils/github-version";

const { trace } = getLogger("title-escrow:accept-surrendered");

export const command = "accept-surrendered [options]";

export const describe = "Accepts a surrendered transferable record on the blockchain";

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
          description: "Hash of document that was surrendered",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TitleEscrowSurrenderDocumentCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  await versionCheck();
  try {
    info(`Accepting surrendered document`);
    const transaction = await acceptSurrendered(args);
    success(`Surrendered transferable record with hash ${args.tokenId} has been accepted.`);
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transaction.transactionHash}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
