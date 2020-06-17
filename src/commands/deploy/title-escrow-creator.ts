import { Argv } from "yargs";
import { error, success, info } from "signale";
import { getLogger } from "../../logger";
import { deployTitleEscrowCreator } from "../../implementations/deploy/title-escrow-creator";
import { DeployTitleEscrowCreatorCommand } from "./deploy.types";
import { withNetworkAndKeyOption } from "../shared";

const { trace } = getLogger("deploy:title-escrow-creator");

export const command = "title-escrow-creator [options]";

export const describe = "Deploys a (global) title escrow creator on the blockchain";

export const builder = (yargs: Argv): Argv => withNetworkAndKeyOption(yargs);

export const handler = async (args: DeployTitleEscrowCreatorCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying title escrow creator`);
    const titleEscrowCreator = await deployTitleEscrowCreator(args);
    success(`Title escrow creator deployed at ${titleEscrowCreator.contractAddress}`);
    info(
      `Find more details at https://${args.network === "ropsten" ? "ropsten." : ""}etherscan.io/address/${
        titleEscrowCreator.contractAddress
      }`
    );
    return titleEscrowCreator.contractAddress;
  } catch (e) {
    error(e.message);
  }
};
