import { TDocDeployer, TDocDeployer__factory } from "@govtechsg/token-registry/contracts";
import { getWalletOrSigner } from "../../utils/wallet";
import signale from "signale";
import { getLogger } from "../../../logger";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { constants } from "@govtechsg/token-registry";
import { BigNumber, ContractReceipt, ethers } from "ethers";
import { DeploymentEvent } from "@govtechsg/token-registry/dist/contracts/contracts/utils/TDocDeployer";
import { TypedEvent } from "@govtechsg/token-registry/dist/contracts/common";

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
}: DeployTokenRegistryCommand): Promise<{ contractAddress: string }> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const chainId = await wallet.getChainId();
  const deployContractAddress: DeployContractAddress = retrieveFactoryAddress(chainId, factoryAddress);

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
  return { contractAddress: registryAddress };
};

interface Params {
  name: string;
  symbol: string;
  deployer: string;
}

export const encodeInitParams = ({ name, symbol, deployer }: Params): string => {
  return ethers.utils.defaultAbiCoder.encode(["string", "string", "address"], [name, symbol, deployer]);
};

export const retrieveFactoryAddress = (chainId: number, factoryAddress: string | undefined): DeployContractAddress => {
  const { contractAddress } = constants;

  if (!chainId) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  let titleEscrowFactory = factoryAddress;
  const tokenImplementation = contractAddress.TokenImplementation[chainId];
  const deployer = contractAddress.Deployer[chainId];

  if (!tokenImplementation || !deployer) {
    throw new Error(`ChainId ${chainId} currently is not supported. Use token-registry to deploy.`);
  }

  if (!titleEscrowFactory) {
    titleEscrowFactory = contractAddress.TitleEscrowFactory[chainId];
    if (!titleEscrowFactory) {
      throw new Error(`ChainId ${chainId} currently is not supported. Supply a factory address.`);
    }
  }

  return {
    titleEscrowFactory: titleEscrowFactory,
    tokenImplementation: tokenImplementation,
    deployer: deployer,
  } as DeployContractAddress;
};

export const getEventFromReceipt = <T extends TypedEvent<any>>(
  receipt: ContractReceipt,
  topic: string,
  iface?: ethers.utils.Interface
): any => {
  if (!receipt.events) throw new Error("Events object is undefined");
  const event = receipt.events.find((evt) => evt.topics[0] === topic);
  if (!event) throw new Error(`Cannot find topic ${topic}`);

  if (iface) return iface.parseLog(event) as unknown as T;
  return event as T;
};
