import { TransactionReceipt } from "@ethersproject/providers";
import { TitleEscrowFactory } from "@govtechsg/token-registry";
import signale from "signale";
import { DeployTitleEscrowCommand } from "../../../commands/deploy/deploy.types";
import { getLogger } from "../../../logger";
import { dryRunMode } from "../../utils/dryRun";
import { validateAddress } from "../../utils/validation";
import { getWalletOrSigner } from "../../utils/wallet";

const { trace } = getLogger("deploy:title-escrow");

const CREATOR_CONTRACTS: { [network: string]: string } = {
  mainnet: "0x907A4D491A09D59Bcb5dC38eeb9d121ac47237F1",
  goerli: "0x3906daFc722089A8eb3D07D833CDE3C84629FF52",
  sepolia: "0xebcFFcDDf84BA6C66C83aE377E41611A43b30c34",
  mumbai: "0xc60E5d2f8ca962f7803B28487fa7cB507daDefE9",
};

export const getDefaultEscrowFactory = (network: string): string => {
  const address = CREATOR_CONTRACTS[network];
  if (!address)
    throw new Error(
      "Title escrow creator not found on this network, please deploy one onto this network and specify the address with the -c flag"
    );
  return address;
};

export const deployTitleEscrow = async ({
  tokenRegistry,
  beneficiary,
  holder,
  titleEscrowFactory,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: DeployTitleEscrowCommand): Promise<TransactionReceipt> => {
  const titleEscrowFactoryAddress = titleEscrowFactory || getDefaultEscrowFactory(network);
  validateAddress(tokenRegistry);
  validateAddress(beneficiary);
  validateAddress(holder);
  validateAddress(titleEscrowFactoryAddress);

  if (dryRun) {
    const factory = new TitleEscrowFactory();
    await dryRunMode({
      network,
      gasPriceScale: gasPriceScale,
      transaction: factory.getDeployTransaction(tokenRegistry, beneficiary, holder, titleEscrowFactoryAddress),
    });
    process.exit(0);
  }

  const wallet = await getWalletOrSigner({ network, ...rest });
  const gasPrice = await wallet.provider.getGasPrice();

  const factory = new TitleEscrowFactory(wallet);
  signale.await(`Sending transaction to pool`);
  const transaction = await factory.deploy(tokenRegistry, beneficiary, holder, titleEscrowFactoryAddress, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.deployTransaction.hash}`);
  trace(`Block Number: ${transaction.deployTransaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.deployTransaction.hash} to be mined`);
  return transaction.deployTransaction.wait();
};
