import { TDocDeployer, TDocDeployer__factory } from "@govtechsg/token-registry/contracts";
import { getWalletOrSigner } from "../../utils/wallet";
import signale from "signale";
import { getLogger } from "../../../logger";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { BigNumber, ethers } from "ethers";
import { DeploymentEvent } from "@govtechsg/token-registry/dist/contracts/contracts/utils/TDocDeployer";
import { utils } from "@govtechsg/token-registry";
import { DeployContractAddress, encodeInitParams, retrieveFactoryAddress } from "./helpers";
import { dryRunMode } from "../../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { calculateMaxFee, scaleBigNumber } from "../../../utils";
const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  factoryAddress,
  tokenImplementationAddress,
  deployerAddress,
  network,
  maxPriorityFeePerGasScale,
  dryRun,
  ...rest
}: DeployTokenRegistryCommand): Promise<TransactionReceipt & { contractAddress: string }> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
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
    await dryRunMode({
      estimatedGas,
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();

  const transaction = await factory.deploy(deployContractAddress.tokenImplementation, initParam, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  const receipt = await transaction.wait();
  const registryAddress = utils.getEventFromReceipt<DeploymentEvent>(
    receipt,
    factory.interface.getEventTopic("Deployment")
  ).args.deployed;
  return { ...receipt, contractAddress: registryAddress };
};
