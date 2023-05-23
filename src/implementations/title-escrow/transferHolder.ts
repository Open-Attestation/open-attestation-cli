import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateTransferHolder } from "./helpers";
import { TitleEscrowTransferHolderCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("title-escrow:transferHolder");

export const transferHolder = async ({
  tokenRegistry: address,
  newHolder: to,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowTransferHolderCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const walletAddress = await wallet.getAddress();
  await validateTransferHolder({
    walletAddress,
    titleEscrow,
    to,
  });
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.transferHolder(to),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  await titleEscrow.callStatic.transferHolder(to);
  const transaction = await titleEscrow.transferHolder(to);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
