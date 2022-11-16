import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { TradeTrustERC721__factory } from "@govtechsg/token-registry/dist/contracts";
import { BigNumber } from "ethers";

const { trace } = getLogger("title-escrow:acceptSurrendered");

export const acceptSurrendered = async ({
  tokenRegistry: address,
  tokenId,
  network,
  maxFeePerGasScale,
  maxPriorityFeePerGasScale,
  feeData,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance = await TradeTrustERC721__factory.connect(address, wallet);
  if (feeData) {
    await dryRunMode({
      estimatedGas: await tokenRegistryInstance.estimateGas.burn(tokenId),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  const { maxFeePerGas, maxPriorityFeePerGas } = await wallet.provider.getFeeData();
  await tokenRegistryInstance.callStatic.burn(tokenId, {
    maxFeePerGas: (maxFeePerGas || BigNumber.from(0)).mul(maxFeePerGasScale),

    maxPriorityFeePerGas: (maxPriorityFeePerGas || BigNumber.from(0)).mul(maxPriorityFeePerGasScale),
  });
  const transaction = await tokenRegistryInstance.burn(tokenId, {
    maxFeePerGas: (maxFeePerGas || BigNumber.from(0)).mul(maxFeePerGasScale),

    maxPriorityFeePerGas: (maxPriorityFeePerGas || BigNumber.from(0)).mul(maxPriorityFeePerGasScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
