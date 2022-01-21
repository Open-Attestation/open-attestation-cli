import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateNominateChangeOwner } from "./helpers";
import { TitleEscrowNominateChangeOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("title-escrow:nominateChangeOfOwner");

export const nominateChangeOfOwner = async ({
  tokenRegistry: address,
  tokenId,
  newOwner,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TitleEscrowNominateChangeOfOwnerCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  if (dryRun) {
    const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
    const holder = await titleEscrow.holder();
    await validateNominateChangeOwner({ newOwner, titleEscrow });
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await titleEscrow.estimateGas.approveNewTransferTargets(newOwner, holder),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const holder = await titleEscrow.holder();
  await validateNominateChangeOwner({ newOwner, titleEscrow });
  await titleEscrow.callStatic.approveNewTransferTargets(newOwner, holder, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  const transaction = await titleEscrow.approveNewTransferTargets(newOwner, holder, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
