import { TDocDeployer__factory, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { DeploymentEvent } from "@govtechsg/token-registry/dist/contracts/contracts/utils/TDocDeployer";
import {
  encodeInitParams,
  getDefaultContractAddress,
  getEventFromReceipt,
  isSupportedTitleEscrowFactory,
} from "./helpers";
import signale from "signale";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { getWalletOrSigner } from "../../utils/wallet";

const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  factory: factoryAddress,
  standalone,
  network,
  dryRun,
  passedOnWallet, // passedOnWallet variable will only be used if we are calling it from create.
  ...rest
}: DeployTokenRegistryCommand): Promise<string> => {
  if (dryRun) {
    throw new Error(`Dry Run command is not supported`);
  }
  const wallet = passedOnWallet ? passedOnWallet : await getWalletOrSigner({ network, ...rest });
  const chainId = await wallet.getChainId();
  const deployerAddress = await wallet.getAddress();
  if (!chainId) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }
  const {
    TitleEscrowFactory: defaultTitleEscrowFactory,
    TokenImplementation: defaultTokenImplementation,
    Deployer: defaultDeployer,
  } = getDefaultContractAddress(chainId);

  trace(`[Deployer] ${deployerAddress}`);

  if (!factoryAddress) {
    factoryAddress = defaultTitleEscrowFactory;
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

  if (!standalone) {
    const deployerContractAddress = defaultDeployer;
    const implAddress = defaultTokenImplementation;
    if (!deployerContractAddress || !implAddress) {
      throw new Error(`Network ${chainId} currently is not supported. Use --standalone instead.`);
    }

    const deployerContract = TDocDeployer__factory.connect(deployerContractAddress, wallet);
    signale.info(`Using ${defaultTitleEscrowFactory} as Title Escrow factory.`);

    const initParam = encodeInitParams({
      name: registryName,
      symbol: registrySymbol,
      deployer: deployerAddress,
    });
    const tx = await deployerContract.deploy(implAddress, initParam);
    trace(`[Transaction] Pending ${tx.hash}`);
    const receipt = await tx.wait();
    const registryAddress = getEventFromReceipt<DeploymentEvent>(
      receipt,
      deployerContract.interface.getEventTopic("Deployment")
    ).args.deployed;
    return registryAddress;
  } else {
    // Standalone deployment
    const tokenFactory = new TradeTrustToken__factory(wallet);
    const token = await tokenFactory.deploy(registryName, registrySymbol, factoryAddress);
    const registryAddress = token.address;
    return registryAddress;
  }
};
