import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateNominateBeneficiary } from "./helpers";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:endorseTransferOfOwner");

export const endorseNominatedBeneficiary = async ({
  tokenRegistry: address,
  tokenId,
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
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.transferBeneficiary(nominatedBeneficiary),
      network,
    });
    process.exit(0);
  }
  const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
  await titleEscrow.callStatic.transferBeneficiary(nominatedBeneficiary, { ...gasFees });
  signale.await(`Sending transaction to pool`);
  const transaction = await titleEscrow.transferBeneficiary(nominatedBeneficiary, { ...gasFees });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  const transactionReceipt = await transaction.wait();
  return {
    transactionReceipt,
    nominatedBeneficiary: nominatedBeneficiary,
  };
};
