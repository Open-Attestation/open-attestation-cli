import { TradeTrustToken, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";
import { validateAndEncryptRemark } from "./helpers";

const { trace } = getLogger("title-escrow:acceptReturned");

export const rejectReturned = async ({
  tokenRegistry: address,
  tokenId,
  remark,
  encryptionKey,
  network,
  dryRun,
  ...rest
}: TitleEscrowReturnDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance: TradeTrustToken = await TradeTrustToken__factory.connect(address, wallet);
  const encryptedRemark = validateAndEncryptRemark(remark, encryptionKey);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await tokenRegistryInstance.estimateGas.restore(tokenId, encryptedRemark),
      network,
    });
    process.exit(0);
  }
  let transaction;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await tokenRegistryInstance.callStatic.restore(tokenId, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await tokenRegistryInstance.restore(tokenId, encryptedRemark, { ...gasFees });
  } else {
    await tokenRegistryInstance.callStatic.restore(tokenId, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await tokenRegistryInstance.restore(tokenId, encryptedRemark);
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
