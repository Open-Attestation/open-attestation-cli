import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import {
  connectToTitleEscrow,
  validatePreviousBeneficiary,
  validatePreviousHolder,
  validateAndEncryptRemark,
} from "./helpers";
import { BaseTitleEscrowCommand as TitleEscrowRejectTransferCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:rejectTransferOwnerHolder");

export const rejectTransferOwnerHolder = async ({
  remark,
  encryptionKey,
  tokenRegistry: address,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowRejectTransferCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const encryptedRemark = validateAndEncryptRemark(remark, encryptionKey);
  await validatePreviousHolder(titleEscrow);
  await validatePreviousBeneficiary(titleEscrow);
  if (dryRun) {
    await validatePreviousHolder(titleEscrow);
    await validatePreviousBeneficiary(titleEscrow);
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.rejectTransferOwners(encryptedRemark),
      network,
    });
    process.exit(0);
  }
  let transaction;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.rejectTransferOwners(encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.rejectTransferOwners(encryptedRemark, { ...gasFees });
  } else {
    await titleEscrow.callStatic.rejectTransferOwners(encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.rejectTransferOwners(encryptedRemark);
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
