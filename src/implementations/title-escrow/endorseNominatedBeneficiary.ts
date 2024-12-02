import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateAndEncryptRemark, validateNominateBeneficiary } from "./helpers";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:endorseTransferOfOwner");

export const endorseNominatedBeneficiary = async ({
  tokenRegistry: address,
  tokenId,
  remark,
  encryptionKey,
  newBeneficiary,
  network,
  dryRun,
  ...rest
}: TitleEscrowNominateBeneficiaryCommand): Promise<{
  transactionReceipt: TransactionReceipt;
  nominatedBeneficiary: string;
}> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const nominatedBeneficiary = newBeneficiary;
  await validateNominateBeneficiary({ beneficiaryNominee: nominatedBeneficiary, titleEscrow });
  const encryptedRemark = validateAndEncryptRemark(remark, encryptionKey);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.transferBeneficiary(nominatedBeneficiary, encryptedRemark),
      network,
    });
    process.exit(0);
  }
  let transaction;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.transferBeneficiary(nominatedBeneficiary, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.transferBeneficiary(nominatedBeneficiary, encryptedRemark, { ...gasFees });
  } else {
    await titleEscrow.callStatic.transferBeneficiary(nominatedBeneficiary, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.transferBeneficiary(nominatedBeneficiary, encryptedRemark);
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  const transactionReceipt = await transaction.wait();
  return {
    transactionReceipt,
    nominatedBeneficiary: nominatedBeneficiary,
  };
};
