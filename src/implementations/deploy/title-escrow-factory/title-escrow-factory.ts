import { DeployTitleEscrowFactoryCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { dryRunMode } from "../../utils/dryRun";
import { getWalletOrSigner } from "../../utils/wallet";
import { TitleEscrowFactory__factory } from "@tradetrust-tt/token-registry/dist/contracts";

const { trace } = getLogger("deploy:title-escrow-factory");

export const deployTitleEscrowFactory = async ({
  network,
  dryRun,
  passedOnWallet, // passedOnWallet variable will only be used if we are calling it from create.
  ...rest
}: DeployTitleEscrowFactoryCommand): Promise<{ contractAddress: string }> => {
  const wallet = passedOnWallet ? passedOnWallet : await getWalletOrSigner({ network, ...rest });
  const deployerAddress = await wallet.getAddress();
  trace(`[Deployer] ${deployerAddress}`);
  const titleEscrowFactoryContract = new TitleEscrowFactory__factory(wallet);
  if (dryRun) {
    await dryRunMode({
      transaction: titleEscrowFactoryContract.getDeployTransaction() as any,
      network,
    });
    process.exit(0);
  }

  const factoryDeployTx = await titleEscrowFactoryContract.deploy();

  trace(`Tx hash: ${factoryDeployTx.deployTransaction.hash}`);
  trace(`Block Number: ${factoryDeployTx.deployTransaction.blockNumber}`);
  await factoryDeployTx.deployed();
  const factoryAddress = factoryDeployTx.address;
  trace(`[Status] Deployed to ${factoryAddress}`);
  return { contractAddress: factoryAddress };
};
