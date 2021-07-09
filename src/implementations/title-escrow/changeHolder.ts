import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWallet } from "../utils/wallet";
import { TitleEscrowChangeHolderCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("token-registry:changeHolder");

export const changeHolderOfTitleEscrow = async ({
  address,
  to,
  tokenId,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
  dryRun,
}: TitleEscrowChangeHolderCommand): Promise<TransactionReceipt> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  if (dryRun) {
    const tokenRegistry = await TradeTrustErc721Factory.connect(address, wallet);
    const titleEscrowAddress = await tokenRegistry.ownerOf(tokenId);
    const titleEscrow = await TitleEscrowFactory.connect(titleEscrowAddress, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await titleEscrow.estimateGas.changeHolder(to),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const tokenRegistry = await TradeTrustErc721Factory.connect(address, wallet);
  const titleEscrowAddress = await tokenRegistry.ownerOf(tokenId);
  const titleEscrow = await TitleEscrowFactory.connect(titleEscrowAddress, wallet);
  const transaction = await titleEscrow.changeHolder(to, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
