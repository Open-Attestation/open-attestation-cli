import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateEndorseChangeOwner as validateEndorseChangeOwners } from "./helpers";
import { TitleEscrowEndorseTransferOfOwnersCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { calculateMaxFee, scaleBigNumber } from "../../utils";

const { trace } = getLogger("title-escrow:endorseChangeOfOwner");

export const transferOwners = async ({
  tokenRegistry: address,
  tokenId,
  newHolder,
  newOwner,
  network,
  maxPriorityFeePerGasScale,
  feeData,
  ...rest
}: TitleEscrowEndorseTransferOfOwnersCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  await validateEndorseChangeOwners({ newHolder, newOwner, titleEscrow });
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  await titleEscrow.callStatic.transferOwners(newOwner, newHolder, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  if (feeData) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.transferOwners(newOwner, newHolder),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const transaction = await titleEscrow.transferOwners(newOwner, newHolder, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
