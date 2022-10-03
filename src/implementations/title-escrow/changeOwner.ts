import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateEndorseChangeOwner } from "./helpers";
import { TitleEscrowEndorseChangeOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("title-escrow:endorseChangeOfOwner");

export const endorseChangeOfOwner = async ({
  tokenRegistry: address,
  tokenId,
  newHolder,
  newOwner,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TitleEscrowEndorseChangeOfOwnerCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  await validateEndorseChangeOwner({ newHolder, newOwner, titleEscrow });
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await titleEscrow.estimateGas.transferOwners(newOwner, newHolder),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  await titleEscrow.callStatic.transferOwners(newOwner, newHolder, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  const transaction = await titleEscrow.transferOwners(newOwner, newHolder, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
