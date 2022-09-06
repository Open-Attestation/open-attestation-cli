import { TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
import { getWalletOrSigner } from "../../utils/wallet";
import signale from "signale";
import { getLogger } from "../../../logger";
import { TransactionReceipt } from "@ethersproject/providers";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { dryRunMode } from "../../utils/dryRun";
import { constants } from "@govtechsg/token-registry";

const { trace } = getLogger("deploy:token-registry");

export const deployTokenRegistry = async ({
  registryName,
  registrySymbol,
  factoryAddress,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: DeployTokenRegistryCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const factory = new TradeTrustERC721__factory(wallet);
  const chainId = await wallet.getChainId();
  const deployerAddress = await wallet.getAddress();
  const { contractAddress } = constants;

  if (!chainId) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  console.log(`[Deployer] ${deployerAddress}`);

  if (!factoryAddress) {
    factoryAddress = contractAddress.TitleEscrowFactory[chainId];
    if (!factoryAddress) {
      throw new Error(`Network ${network} currently is not supported. Supply a factory address.`);
    }
    console.log(`[Status] Using ${factoryAddress} as Title Escrow factory.`);
  }

  if (dryRun) {
    const tx = factory.getDeployTransaction(registryName, registrySymbol, factoryAddress, {});
    await dryRunMode({
      network,
      gasPriceScale: gasPriceScale,
      transaction: tx,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);

  const transaction = await factory.deploy(registryName, registrySymbol, factoryAddress, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
