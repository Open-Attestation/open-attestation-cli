import { TDocDeployer, TDocDeployer__factory } from "@govtechsg/token-registry/contracts";
import { getWalletOrSigner } from "../../utils/wallet";
import signale from "signale";
import { getLogger } from "../../../logger";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { constants } from "@govtechsg/token-registry";
import { BigNumber, ethers } from "ethers";
import { encodeInitParams, getEventFromReceipt } from "@govtechsg/token-registry/dist/types/utils";
import { DeploymentEvent } from "@govtechsg/token-registry/dist/contracts/contracts/utils/TDocDeployer";

const { trace } = getLogger("deploy:token-registry");

interface DeployContractAddress {
  titleEscrowFactory: string;
  tokenImplementation: string;
  deployer: string;
}

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  factoryAddress,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: DeployTokenRegistryCommand): Promise<string> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const chainId = await wallet.getChainId();
  const deployContractAddress: DeployContractAddress = retrieveFactoryAddress(chainId, factoryAddress);

  const factory = new ethers.Contract(
    deployContractAddress.deployer,
    TDocDeployer__factory.createInterface(),
    wallet
  ) as TDocDeployer;
  signale.info(`Using ${factoryAddress} as Title Escrow factory.`);

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
    signale.info("Dry Run is unavailable for token reigstry deploy");
    signale.info(`Estimated Gas Required: ${estimatedGas.toString()}`);
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);

  const transaction = await factory.deploy(deployContractAddress.tokenImplementation, initParam, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  const receipt = await transaction.wait();
  const registryAddress = getEventFromReceipt<DeploymentEvent>(receipt, factory.interface.getEventTopic("Deployment"))
    .args.deployed;
  return registryAddress;
};

const retrieveFactoryAddress = (chainId: number, factoryAddress: string | undefined): DeployContractAddress => {
  const { contractAddress } = constants;

  if (!chainId) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  const deployContractAddress = {
    titleEscrowFactory: factoryAddress,
    tokenImplementation: contractAddress.TokenImplementation[chainId],
    deployer: contractAddress.Deployer[chainId],
  } as DeployContractAddress;

  if (!deployContractAddress["tokenImplementation"] || !deployContractAddress["deployer"]) {
    throw new Error(`ChainId ${chainId} currently is not supported. Use token-registry to deploy.`);
  }

  if (!factoryAddress) {
    deployContractAddress["titleEscrowFactory"] = contractAddress.TitleEscrowFactory[chainId];
    if (!factoryAddress) {
      throw new Error(`ChainId ${chainId} currently is not supported. Supply a factory address.`);
    }
  }

  if (!factoryAddress) {
    if (!chainId) {
      throw new Error(`Invalid chain ID: ${chainId}`);
    }
    factoryAddress = contractAddress.TitleEscrowFactory[chainId];
    if (!factoryAddress) {
      throw new Error(`ChainId ${chainId} currently is not supported. Supply a factory address.`);
    }
  }

  return deployContractAddress;
};
