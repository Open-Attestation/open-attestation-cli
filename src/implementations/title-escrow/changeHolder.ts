import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow } from "./helpers";
import { TitleEscrowChangeHolderCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getSolidityErrorHandler } from "../utils/solidityErrorHandling";
import { getErrorMessage } from "../../utils";

const { trace } = getLogger("title-escrow:changeHolder");

export const changeHolderOfTitleEscrow = async ({
  tokenRegistry: address,
  to,
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TitleEscrowChangeHolderCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  titleEscrow.callStatic.changeHolder(to).catch(function (err) {
    signale.error(getErrorMessage(err));
    process.exit(0);
  });
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await titleEscrow.estimateGas.changeHolder(to),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  try {
    const transaction = await titleEscrow.changeHolder(to, { gasPrice: gasPrice.mul(gasPriceScale) });
    trace(`Tx hash: ${transaction.hash}`);
    trace(`Block Number: ${transaction.blockNumber}`);
    signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
    return transaction.wait();
  } catch (error) {
    titleEscrow.interface;
    const failureReason = await getSolidityErrorHandler(network)(error);
    throw new Error(failureReason);
  }
};
