import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { connectToTokenRegistry, validateSurrenderMethod } from "./helpers";

const { trace } = getLogger("title-escrow:acceptSurrendered");

export const acceptSurrendered = async ({
  tokenRegistry: address,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance = await connectToTokenRegistry({ address, wallet });
  await validateSurrenderMethod({ tokenRegistry: tokenRegistryInstance, tokenId, wallet });
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await tokenRegistryInstance.estimateGas.burn(tokenId),
      network,
    });
    process.exit(0);
  }
  signale.await(`Sending transaction to pool`);
  const transaction = await tokenRegistryInstance.burn(tokenId);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
