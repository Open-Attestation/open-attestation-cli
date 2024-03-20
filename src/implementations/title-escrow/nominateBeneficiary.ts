import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateNominateBeneficiary } from "./helpers";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:nominateChangeOfOwner");

export const nominateBeneficiary = async ({
  tokenRegistry: address,
  tokenId,
  newBeneficiary,
  network,
  dryRun,
  ...rest
}: TitleEscrowNominateBeneficiaryCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
  if (dryRun) {
    await validateNominateBeneficiary({ beneficiaryNominee: newBeneficiary, titleEscrow });
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.nominate(newBeneficiary),
      network,
    });
    process.exit(0);
  }
  const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
  trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
  trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
  await titleEscrow.callStatic.nominate(newBeneficiary);
  signale.await(`Sending transaction to pool`);
  const transaction = await titleEscrow.nominate(newBeneficiary, { ...gasFees });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
