import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateEndorseTransferOwner } from "./helpers";
import { BaseTitleEscrowCommand as TitleEscrowEndorseTransferOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("title-escrow:endorseTransferOfOwner");

export const endorseTransferOfOwner = async ({
  tokenRegistry: address,
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TitleEscrowEndorseTransferOfOwnerCommand): Promise<{
  transactionReceipt: TransactionReceipt;
  approvedOwner: string;
  approvedHolder: string;
}> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  if (dryRun) {
    const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
    const approvedBeneficiary = await titleEscrow.approvedBeneficiary();
    const approvedHolder = await titleEscrow.approvedHolder();
    await validateEndorseTransferOwner({ approvedOwner: approvedBeneficiary, approvedHolder });
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await titleEscrow.estimateGas.transferToNewEscrow(approvedBeneficiary, approvedHolder),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const approvedBeneficiary = await titleEscrow.approvedBeneficiary();
  const approvedHolder = await titleEscrow.approvedHolder();
  await validateEndorseTransferOwner({ approvedOwner: approvedBeneficiary, approvedHolder });
  await titleEscrow.callStatic.transferToNewEscrow(approvedBeneficiary, approvedHolder);
  const transaction = await titleEscrow.transferToNewEscrow(approvedBeneficiary, approvedHolder, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  const transactionReceipt = await transaction.wait();
  return {
    transactionReceipt,
    approvedOwner: approvedBeneficiary,
    approvedHolder,
  };
};
