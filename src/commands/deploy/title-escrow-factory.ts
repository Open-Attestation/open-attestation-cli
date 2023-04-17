import { Argv } from "yargs";
import { error, info, success } from "signale";
import { getLogger } from "../../logger";

import { DeployTitleEscrowFactoryCommand } from "./deploy.types";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { getErrorMessage, getEtherscanAddress, highlight } from "../../utils";
import { deployTitleEscrowFactory } from "../../implementations/deploy/title-escrow-factory/title-escrow-factory";

const { trace } = getLogger("deploy:title-escrow-factory");

export const command = "title-escrow-factory [options]";

export const describe = "Deploys a title escrow factory contract on the blockchain";

export const builder = (yargs: Argv): Argv => withGasPriceOption(withNetworkAndWalletSignerOption(yargs));

export const handler = async (args: DeployTitleEscrowFactoryCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(`Deploying title escrow factory`);
    const escrowFactory = await deployTitleEscrowFactory(args);
    success(`Title escrow factory deployed at ${highlight(escrowFactory.contractAddress)}`);
    info(
      `Find more details at ${getEtherscanAddress({ network: args.network })}/address/${escrowFactory.contractAddress}`
    );
    return escrowFactory.contractAddress;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
