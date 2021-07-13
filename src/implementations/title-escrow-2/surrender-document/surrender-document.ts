import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../../logger";
import { getWallet } from "../../utils/wallet";
import { TitleEscrowSurrenderDocumentCommand } from "../../../commands/title-escrow-2/title-escrow-command.type";

import { dryRunMode } from "../../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("token-registry:surrenderDocument");

export const surrenderDocument = async ({
  tokenRegistry,
  tokenId,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
  dryRun,
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  if (dryRun) {
    const tokenRegistryInstance = await TradeTrustErc721Factory.connect(tokenRegistry, wallet);
    const titleEscrowAddress = await tokenRegistryInstance.ownerOf(tokenId);
    const titleEscrow = await TitleEscrowFactory.connect(titleEscrowAddress, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await titleEscrow.estimateGas.transferTo(tokenRegistry),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const tokenRegistryInstance = await TradeTrustErc721Factory.connect(tokenRegistry, wallet);
  const titleEscrowAddress = await tokenRegistryInstance.ownerOf(tokenId);
  const titleEscrow = await TitleEscrowFactory.connect(titleEscrowAddress, wallet);
  const transaction = await titleEscrow.transferTo(tokenRegistry, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
