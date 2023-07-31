import { TradeTrustToken, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { connectToTokenRegistry } from "../utils/connect";

const { trace } = getLogger("title-escrow:acceptSurrendered");

export const rejectSurrendered = async ({
  tokenRegistry: address,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance: TradeTrustToken = await connectToTokenRegistry(address, wallet);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await tokenRegistryInstance.estimateGas.restore(tokenId),
      network,
    });
    process.exit(0);
  }
  signale.await(`Sending transaction to pool`);
  await tokenRegistryInstance.callStatic.restore(tokenId);
  const transaction = await tokenRegistryInstance.restore(tokenId);

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
