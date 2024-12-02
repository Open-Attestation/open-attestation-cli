import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateAndEncryptRemark, validateNominateBeneficiary } from "./helpers";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:nominateChangeOfOwner");

export const nominateBeneficiary = async ({
  tokenRegistry: address,
  tokenId,
  newBeneficiary,
  remark,
  encryptionKey,
  network,
  dryRun,
  ...rest
}: TitleEscrowNominateBeneficiaryCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const encryptedRemark = validateAndEncryptRemark(remark, encryptionKey);
  await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
  if (dryRun) {
    await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.nominate(newBeneficiary, encryptedRemark),
      network,
    });
    process.exit(0);
  }
  let transaction;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.nominate(newBeneficiary, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.nominate(newBeneficiary, encryptedRemark, { ...gasFees });
  } else {
    await titleEscrow.callStatic.nominate(newBeneficiary, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.nominate(newBeneficiary, encryptedRemark);
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
