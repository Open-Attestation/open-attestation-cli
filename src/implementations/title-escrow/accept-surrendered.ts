import { TradeTrustErc721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWallet } from "../utils/wallet";
import { TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("token-registry:acceptSurrendered");

export const acceptSurrendered = async ({
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
  const tokenRegistryInstance = await TradeTrustErc721Factory.connect(tokenRegistry, wallet);
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await tokenRegistryInstance.estimateGas.destroyToken(tokenId),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const transaction = await tokenRegistryInstance.destroyToken(tokenId, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
