import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateAndEncryptRemark } from "./helpers";
import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:returnDocument");

export const returnDocument = async ({
  remark,
  encryptionKey,
  tokenRegistry: address,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowReturnDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const encryptedRemark = validateAndEncryptRemark(remark, encryptionKey);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.returnToIssuer(encryptedRemark),
      network,
    });
    process.exit(0);
  }
  let transaction;

  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.returnToIssuer(encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.returnToIssuer(encryptedRemark, { ...gasFees });
  } else {
    await titleEscrow.callStatic.returnToIssuer(encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.returnToIssuer(encryptedRemark);
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
