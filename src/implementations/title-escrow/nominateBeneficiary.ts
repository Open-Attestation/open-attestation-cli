import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateNominateBeneficiary } from "./helpers";
import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

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
  const walletAddress = await wallet.getAddress();
  await validateNominateBeneficiary({ to: newBeneficiary, titleEscrow, walletAddress });
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.nominate(newBeneficiary),
      network,
    });
    process.exit(0);
  }
  signale.await(`Sending transaction to pool`);
  await titleEscrow.callStatic.nominate(newBeneficiary);
  const transaction = await titleEscrow.nominate(newBeneficiary);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
