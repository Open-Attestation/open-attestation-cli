import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateNominateBeneficiary } from "./helpers";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { calculateMaxFee, scaleBigNumber } from "../../utils";

const { trace } = getLogger("title-escrow:nominateChangeOfOwner");

export const nominateBeneficiary = async ({
  tokenRegistry: address,
  tokenId,
  newBeneficiary,
  network,
  maxPriorityFeePerGasScale,
  dryRun,
  ...rest
}: TitleEscrowNominateBeneficiaryCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  await titleEscrow.callStatic.nominate(newBeneficiary, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  if (dryRun) {
    await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.nominate(newBeneficiary),
      network,
    });
    process.exit(0);
  }
  signale.await(`Sending transaction to pool`);
  const transaction = await titleEscrow.nominate(newBeneficiary, {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
