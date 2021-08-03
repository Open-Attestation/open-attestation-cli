import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { ConnectedSigner, getWalletOrSigner } from "../utils/wallet";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { TradeTrustERC721 } from "@govtechsg/token-registry/dist/ts/contracts";
import { Wallet } from "ethers";

const { trace } = getLogger("title-escrow:acceptSurrendered");

const retrieveLastBeneficiaryAndHolder = async (
  tokenRegistryInstance: TradeTrustERC721,
  tokenId: string,
  wallet: Wallet | ConnectedSigner
): Promise<{ lastBeneficiary: string; lastHolder: string }> => {
  // Fetch transfer logs from token registry
  const transferLogFilter = tokenRegistryInstance.filters.Transfer(null, null, tokenId);
  const logs = await tokenRegistryInstance.queryFilter(transferLogFilter, 0);
  const lastTitleEscrowAddress = logs[logs.length - 1].args?.[0];
  const lastTitleEscrowInstance = await TitleEscrowFactory.connect(lastTitleEscrowAddress, wallet);
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
  const tokenRegistryInstance = await TradeTrustErc721Factory.connect(address, wallet);
  if (dryRun) {
    const { lastBeneficiary, lastHolder } = await retrieveLastBeneficiaryAndHolder(
      tokenRegistryInstance,
      tokenId,
      wallet
    );
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await tokenRegistryInstance.estimateGas.sendToNewTitleEscrow(lastBeneficiary, lastHolder, tokenId),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const { lastBeneficiary, lastHolder } = await retrieveLastBeneficiaryAndHolder(
    tokenRegistryInstance,
    tokenId,
    wallet
  );
  const transaction = await tokenRegistryInstance.sendToNewTitleEscrow(lastBeneficiary, lastHolder, tokenId, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
