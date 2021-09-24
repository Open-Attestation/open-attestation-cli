import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { deployTitleEscrow } from "../../implementations/deploy/title-escrow";
import { DeployTitleEscrowCommand } from "./deploy.types";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("deploy:title-escrow");

export const command = "title-escrow [options]";

export const describe = "Deploys a title escrow on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("token-registry", {
          alias: "r",
          description: "Address of ERC721 contract that the escrow will receive the token from",
          type: "string",
          normalize: true,
          required: true,
        })
        .option("beneficiary", {
          alias: "b",
          description: "Beneficiary address",
          type: "string",
          normalize: true,
          required: true,
        })
        .option("holder", {
          alias: "h",
          description: "Holder address",
          type: "string",
          normalize: true,
          required: true,
        })
        .option("title-escrow-factory", {
          alias: "c",
          description: "Address of title escrow creator/factory",
          type: "string",
          normalize: true,
        })
    )
  );

export const handler = async (args: DeployTitleEscrowCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying title escrow`);
    const titleEscrow = await deployTitleEscrow(args);
    success(`Title escrow deployed at ${titleEscrow.contractAddress}`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${titleEscrow.contractAddress}`
    );
    return titleEscrow.contractAddress;
  } catch (e) {
    if (e instanceof TypeError) {
      error(e.message);
    }
  }
};
