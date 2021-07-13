import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { TitleEscrowSurrenderDocumentCommand } from "./title-escrow-command.type";
import { rejectSurrendered } from "../../implementations/title-escrow-2";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("surrender:title-escrow");

export const command = "reject-surrendered [options]";

export const describe = "Rejects a surrendered transferable record on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndKeyOption(
      yargs
        .option("token-registry", {
          alias: "r",
          description: "Address of the token registry that the transferable record was issued from",
          type: "string",
          normalize: true,
          required: true,
        })
        .option("tokenId", {
          description: "Hash of document to surrender",
          type: "string",
          demandOption: true,
        })
    )
  );

export const handler = async (args: TitleEscrowSurrenderDocumentCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Rejecting surrendered document`);
    const transaction = await rejectSurrendered(args);
    success(`Surrendered transferable record with hash ${args.tokenId} has been rejected.`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${transaction.contractAddress}`
    );
    return transaction.contractAddress;
  } catch (e) {
    error(e.message);
  }
};
