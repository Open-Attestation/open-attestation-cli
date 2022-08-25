import { TradeTrustERC721 } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { ConnectedSigner, getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { ContractTransaction, Wallet } from "ethers";
import { connectToTokenRegistry } from "../token-registry/helpers";
import { connectToTitleEscrowFactory } from "./helpers";

const { trace } = getLogger("title-escrow:acceptSurrendered");

const retrieveLastBeneficiaryAndHolder = async (
  isV3: boolean,
  tokenRegistryInstance: TradeTrustERC721,
  tokenId: string,
  wallet: Wallet | ConnectedSigner
): Promise<{ lastBeneficiary: string; lastHolder: string }> => {
  // Fetch transfer logs from token registry
  const transferLogFilter = tokenRegistryInstance.filters.Transfer(null, null, tokenId);
  const logs = await tokenRegistryInstance.queryFilter(transferLogFilter, 0);
  const lastTitleEscrowAddress = logs[logs.length - 1].args?.[0];
  const lastTitleEscrowInstance = await connectToTitleEscrowFactory(lastTitleEscrowAddress, wallet);
  const lastBeneficiary = await lastTitleEscrowInstance.beneficiary();
  const lastHolder = await lastTitleEscrowInstance.holder();
  return { lastBeneficiary, lastHolder };
};

export const rejectSurrendered = async ({
  tokenRegistry: address,
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TitleEscrowSurrenderDocumentCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistryInstance  = await connectToTokenRegistry({ address, wallet });
  let transaction: ContractTransaction;
  
    transaction = await rejectsurrenderV3Document({
      tokenRegistry: address,
      tokenId,
      network,
      gasPriceScale,
      dryRun,
      tokenRegistryInstance,
      wallet,
    });
  
  
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};

export type VersionedTitleEscrowRejectSurrenderDocumentCommand = TitleEscrowSurrenderDocumentCommand & {
  tokenRegistryInstance: TradeTrustERC721;
  wallet: Wallet | ConnectedSigner;
};

export const rejectsurrenderV3Document = async ({
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  tokenRegistryInstance,
  wallet,
}: VersionedTitleEscrowRejectSurrenderDocumentCommand): Promise<ContractTransaction> => {
  const isV3 = true;
  const V2tokenRegistryInstance = tokenRegistryInstance as TradeTrustERC721;
  const { lastBeneficiary, lastHolder } = await retrieveLastBeneficiaryAndHolder(
    isV3,
    tokenRegistryInstance,
    tokenId,
    wallet
  );
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await V2tokenRegistryInstance.estimateGas.restoreTitle(lastBeneficiary, lastHolder, tokenId),
      network,
    });
    process.exit(0);
  }
  signale.await(`Sending transaction to pool`);
  await V2tokenRegistryInstance.callStatic.restoreTitle(lastBeneficiary, lastHolder, tokenId);
  const transaction = await V2tokenRegistryInstance.restoreTitle(lastBeneficiary, lastHolder, tokenId);
  return transaction;
};
