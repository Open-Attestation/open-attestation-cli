import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { TradeTrustERC721__factory } from "@govtechsg/token-registry/dist/contracts";

const { trace } = getLogger("title-escrow:acceptSurrendered");

export const acceptSurrendered = async ({
  tokenRegistry: address,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance = await TradeTrustERC721__factory.connect(address, wallet);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await tokenRegistryInstance.estimateGas.burn(tokenId),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  await tokenRegistryInstance.callStatic.burn(tokenId);
  const transaction = await tokenRegistryInstance.burn(tokenId);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
