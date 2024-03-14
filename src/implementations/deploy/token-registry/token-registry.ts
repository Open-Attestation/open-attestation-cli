import { TDocDeployer__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { DeploymentEvent } from "@tradetrust-tt/token-registry/dist/contracts/contracts/utils/TDocDeployer";
import {
  encodeInitParams,
  getDefaultContractAddress,
  getEventFromReceipt,
  isSupportedTitleEscrowFactory,
  isValidAddress,
} from "./helpers";
import { info } from "signale";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWalletOrSigner } from "../../utils/wallet";
import { dryRunMode } from "../../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { canEstimateGasPrice, getGasFees } from "../../../utils";
const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  factory: factoryAddress,
  token: implAddress,
  deployer: deployerContractAddress,
  standalone,
  network,
  dryRun,
  passedOnWallet, // passedOnWallet variable will only be used if we are calling it from create.
  ...rest
}: DeployTokenRegistryCommand): Promise<{ transaction: TransactionReceipt; contractAddress: string }> => {
  const wallet = passedOnWallet ? passedOnWallet : await getWalletOrSigner({ network, ...rest });
  const chainId = await wallet.getChainId();
  const deployerAddress = await wallet.getAddress();
  if (!chainId) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }
  const {
    TitleEscrowFactory: defaultTitleEscrowFactoryAddress,
    TokenImplementation: defaultTokenImplementationContractAddress,
    Deployer: defaultDeployerContractAddress,
  } = getDefaultContractAddress(chainId);
  trace(`[Deployer] ${deployerAddress}`);

  if (!factoryAddress || !isValidAddress(factoryAddress)) {
    factoryAddress = defaultTitleEscrowFactoryAddress;
    if (!factoryAddress) {
      throw new Error(`Network ${chainId} currently is not supported. Supply a factory address.`);
    }
    trace(`[Status] Using ${factoryAddress} as Title Escrow factory.`);
  }

  const supportedTitleEscrowFactory = await isSupportedTitleEscrowFactory(factoryAddress, wallet.provider);
  if (!supportedTitleEscrowFactory) {
    throw new Error(`Title Escrow Factory ${factoryAddress} is not supported.`);
  }
  trace("[Status] Title Escrow Factory interface check is OK.");

  info(`Using ${factoryAddress} as Title Escrow factory.`);

  // Blockchains where deployers are not supported.
  if (!isValidAddress(deployerContractAddress)) {
    deployerContractAddress = defaultDeployerContractAddress;
  }
  if (!isValidAddress(implAddress)) {
    implAddress = defaultTokenImplementationContractAddress;
  }

  if (standalone !== false && (!deployerContractAddress || !implAddress)) {
    console.error(`Network ${chainId} does not support "quick-start" mode. Defaulting to --standalone mode.`);
    standalone = true;
  }

  let gasFees;

  if (canEstimateGasPrice(network)) {
    gasFees = await getGasFees({ provider: wallet.provider, network, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
  }

  if (!standalone) {
    if (!deployerContractAddress || !implAddress) {
      throw new Error(`Network ${chainId} currently is not supported. Use --standalone instead.`);
    }

    const deployerContract = TDocDeployer__factory.connect(deployerContractAddress, wallet);

    const initParam = encodeInitParams({
      name: registryName,
      symbol: registrySymbol,
      deployer: deployerAddress,
    });

    if (dryRun) {
      const estimatedGas = await deployerContract.estimateGas.deploy(implAddress, initParam);
      await dryRunMode({
        estimatedGas,
        network,
      });
      process.exit(0);
    }
    let tx;
    if (canEstimateGasPrice(network)) {
      tx = await deployerContract.deploy(implAddress, initParam, { ...gasFees });
    } else {
      tx = await deployerContract.deploy(implAddress, initParam);
    }
    trace(`[Transaction] Pending ${tx.hash}`);
    const receipt = await tx.wait();
    const registryAddress = getEventFromReceipt<DeploymentEvent>(
      receipt,
      deployerContract.interface.getEventTopic("Deployment")
    ).args.deployed;
    return { transaction: receipt, contractAddress: registryAddress };
  } else {
    // Standalone deployment
    const tokenFactory = new TradeTrustToken__factory(wallet);
    if (dryRun) {
      const transactionRequest = tokenFactory.getDeployTransaction(registryName, registrySymbol, factoryAddress);
      const estimatedGas = await wallet.estimateGas(transactionRequest);
      await dryRunMode({
        estimatedGas,
        network,
      });
      process.exit();
    }
    let token;
    if (canEstimateGasPrice(network)) {
      token = await tokenFactory.deploy(registryName, registrySymbol, factoryAddress, { ...gasFees });
    } else {
      token = await tokenFactory.deploy(registryName, registrySymbol, factoryAddress);
    }
    const registryAddress = token.address;
    return { transaction: await token.deployTransaction.wait(), contractAddress: registryAddress };
  }
};
