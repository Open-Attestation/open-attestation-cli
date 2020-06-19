import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { deployTitleEscrow } from "../../implementations/deploy/title-escrow";
import { DeployTitleEscrowCommand } from "./deploy.types";
import { withNetworkAndKeyOption } from "../shared";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("deploy:title-escrow");

export const command = "title-escrow [options]";

export const describe = "Deploys a title escrow on the blockchain";

export const builder = (yargs: Argv): Argv =>
  withNetworkAndKeyOption(
    yargs
      .option("token-registry", {
        alias: "r",
        description: "Address of ERC721 contract that the escrow will receive the token from",
        normalize: true,
        required: true
      })
      .option("beneficiary", {
        alias: "b",
        description: "Beneficiary address",
        normalize: true,
        required: true
      })
      .option("holder", {
        alias: "h",
        description: "Holder address",
        normalize: true,
        required: true
      })
      .option("title-escrow-factory", {
        alias: "c",
        description: "Address of title escrow creator/factory",
        normalize: true,
        required: true
      })
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
    error(e.message);
  }
};
