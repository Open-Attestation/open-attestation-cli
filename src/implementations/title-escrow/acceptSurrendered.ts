import { TradeTrustErc721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("title-escrow:acceptSurrendered");

export const acceptSurrendered = async ({
  address,
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance = await TradeTrustErc721Factory.connect(address, wallet);
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
