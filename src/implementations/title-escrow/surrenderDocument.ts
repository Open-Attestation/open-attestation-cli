import signale from "signale";
import { getLogger } from "../../logger";
import { ConnectedSigner, getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow } from "./helpers";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { ContractTransaction, Wallet } from "ethers";
import { TitleEscrowCloneable } from "@govtechsg/token-registry";

const { trace } = getLogger("title-escrow:surrenderDocument");

export const surrenderDocument = async ({
  tokenRegistry: address,
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  let transaction: ContractTransaction;
  
    transaction = await surrenderV3Document({
      tokenRegistry: address,
      tokenId,
      network,
      gasPriceScale,
      dryRun,
      titleEscrow,
      wallet,
    });
  
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};

export type VersionedTitleEscrowSurrenderDocumentCommand = TitleEscrowSurrenderDocumentCommand & {
  titleEscrow: TitleEscrowCloneable;
  wallet: Wallet | ConnectedSigner;
};

export const surrenderV3Document = async ({
  network,
  gasPriceScale,
  dryRun,
  titleEscrow,
  wallet,
}: VersionedTitleEscrowSurrenderDocumentCommand): Promise<ContractTransaction> => {
  const V3titleEscrow = titleEscrow as TitleEscrowCloneable;
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await V3titleEscrow.estimateGas.surrender(),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  await V3titleEscrow.callStatic.surrender({ gasPrice: gasPrice.mul(gasPriceScale) });
  const transaction = await V3titleEscrow.surrender({ gasPrice: gasPrice.mul(gasPriceScale) });
  return transaction;
};
