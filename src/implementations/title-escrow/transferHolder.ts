import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow } from "./helpers";
import { TitleEscrowTransferHolderCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber } from "ethers";

const { trace } = getLogger("title-escrow:transferHolder");

export const transferHolder = async ({
  tokenRegistry: address,
  newHolder: to,
  tokenId,
  network,
  maxFeePerGasScale,
  maxPriorityFeePerGasScale,
  feeData,
  ...rest
}: TitleEscrowTransferHolderCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  if (feeData) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.transferHolder(to),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  await titleEscrow.callStatic.transferHolder(to);
  const transaction = await titleEscrow.transferHolder(to, {
    maxFeePerGas: (maxFeePerGas || BigNumber.from(0)).mul(maxFeePerGasScale),
    maxPriorityFeePerGas: (maxPriorityFeePerGas || BigNumber.from(0)).mul(maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
