import signale from "signale";
import { getLogger } from "../../logger";
import { ConnectedSigner, getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow } from "./helpers";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { ContractTransaction, Wallet } from "ethers";
import { TitleEscrowCloneable } from "@govtechsg/token-registry";
import { TitleEscrow } from "@govtechsg/token-registry-v2/dist/ts/contracts";

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
  const { isV3, contract: titleEscrow } = await connectToTitleEscrow({ tokenId, address, wallet });
  let transaction: ContractTransaction;
  if (isV3) {
    transaction = await surrenderV3Document({
      tokenRegistry: address,
      tokenId,
      network,
      gasPriceScale,
      dryRun,
      titleEscrow,
      wallet,
    });
  } else {
    transaction = await surrenderV2Document({
      tokenRegistry: address,
      tokenId,
      network,
      gasPriceScale,
      dryRun,
      titleEscrow,
      wallet,
    });
  }
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};

export type VersionedTitleEscrowSurrenderDocumentCommand = TitleEscrowSurrenderDocumentCommand & {
  titleEscrow: TitleEscrow | TitleEscrowCloneable;
  wallet: Wallet | ConnectedSigner;
};

export const surrenderV2Document = async ({
  tokenRegistry: address,
  network,
  gasPriceScale,
  dryRun,
  titleEscrow,
  wallet,
}: VersionedTitleEscrowSurrenderDocumentCommand): Promise<ContractTransaction> => {
  const V2titleEscrow = titleEscrow as TitleEscrow;
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await V2titleEscrow.estimateGas.transferTo(address),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  await V2titleEscrow.callStatic.transferTo(address, { gasPrice: gasPrice.mul(gasPriceScale) });
  const transaction = await V2titleEscrow.transferTo(address, { gasPrice: gasPrice.mul(gasPriceScale) });
  return transaction;
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
