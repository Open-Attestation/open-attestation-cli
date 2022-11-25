import { TradeTrustERC721, TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { calculateMaxFee, scaleBigNumber } from "../../utils";

const { trace } = getLogger("title-escrow:acceptSurrendered");

export const rejectSurrendered = async ({
  tokenRegistry: address,
  tokenId,
  network,
  maxPriorityFeePerGasScale,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance: TradeTrustERC721 = await TradeTrustERC721__factory.connect(address, wallet);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  await tokenRegistryInstance.callStatic.restore(tokenId, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await tokenRegistryInstance.estimateGas.restore(tokenId),
      network,
    });
    process.exit(0);
  }
  signale.await(`Sending transaction to pool`);
  const transaction = await tokenRegistryInstance.restore(tokenId, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
