import { TDocDeployer, TDocDeployer__factory } from "@govtechsg/token-registry/contracts";
import { BigNumber, ethers } from "ethers";
import { DeploymentEvent } from "@govtechsg/token-registry/dist/contracts/contracts/utils/TDocDeployer";
import { utils } from "@govtechsg/token-registry";
import { DeployContractAddress, encodeInitParams, retrieveFactoryAddress } from "./helpers";
import signale from "signale";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWalletOrSigner } from "../../utils/wallet";

const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  factoryAddress,
  tokenImplementationAddress,
  deployerAddress,
  network,
  dryRun,
  passedOnWallet, // passedOnWallet variable will only be used if we are calling it from create.
  ...rest
}: DeployTokenRegistryCommand): Promise<{ contractAddress: string }> => {
  const wallet = passedOnWallet ? passedOnWallet : await getWalletOrSigner({ network, ...rest });
  const chainId = await wallet.getChainId();
  const deployContractAddressInput: DeployContractAddress = {
    titleEscrowFactory: factoryAddress || "",
    tokenImplementation: tokenImplementationAddress || "",
    deployer: deployerAddress || "",
  };
  const deployContractAddress: DeployContractAddress = retrieveFactoryAddress(chainId, deployContractAddressInput);

  const factory = new ethers.Contract(
    deployContractAddress.deployer,
    TDocDeployer__factory.createInterface(),
    wallet
  ) as TDocDeployer;
  signale.info(`Using ${deployContractAddress.titleEscrowFactory} as Title Escrow factory.`);

  const initParam = encodeInitParams({
    name: registryName,
    symbol: registrySymbol,
    deployer: await wallet.getAddress(),
  });

  if (dryRun) {
    const estimatedGas: BigNumber = await factory.estimateGas.deploy(
      deployContractAddress.tokenImplementation,
      initParam
    );
    signale.info("Dry Run is unavailable for token registry deploy");
    signale.info(`Estimated Gas Required: ${estimatedGas.toString()}`);
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);

  const transaction = await factory.deploy(deployContractAddress.tokenImplementation, initParam);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  const receipt = await transaction.wait();
  const registryAddress = utils.getEventFromReceipt<DeploymentEvent>(
    receipt,
    factory.interface.getEventTopic("Deployment")
  ).args.deployed;
  return { contractAddress: registryAddress };
};
