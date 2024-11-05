import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow } from "./helpers";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:surrenderDocument");

export const surrenderDocument = async ({
  tokenRegistry: address,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.returnToIssuer("0x"),
      network,
    });
    process.exit(0);
  }
  let transaction;

  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.returnToIssuer("0x");
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.returnToIssuer("0x", { ...gasFees });
  } else {
    await titleEscrow.callStatic.returnToIssuer("0x");
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.returnToIssuer("0x");
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
