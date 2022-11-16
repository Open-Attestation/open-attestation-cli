import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateNominateBeneficiary } from "./helpers";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber } from "ethers";

const { trace } = getLogger("title-escrow:nominateChangeOfOwner");

export const nominateBeneficiary = async ({
  tokenRegistry: address,
  tokenId,
  newBeneficiary,
  network,
  maxFeePerGasScale,
  maxPriorityFeePerGasScale,
  feeData,
  ...rest
}: TitleEscrowNominateBeneficiaryCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  if (feeData) {
    await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.nominate(newBeneficiary),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
  await titleEscrow.callStatic.nominate(newBeneficiary, {
    maxFeePerGas: (maxFeePerGas || BigNumber.from(0)).mul(maxFeePerGasScale),
    maxPriorityFeePerGas: (maxPriorityFeePerGas || BigNumber.from(0)).mul(maxPriorityFeePerGasScale),
  });
  const transaction = await titleEscrow.nominate(newBeneficiary, {
    maxFeePerGas: (maxFeePerGas || BigNumber.from(0)).mul(maxFeePerGasScale),

    maxPriorityFeePerGas: (maxPriorityFeePerGas || BigNumber.from(0)).mul(maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
