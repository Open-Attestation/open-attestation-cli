import { TradeTrustToken, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("token-registry:issue");

export const issueToTokenRegistry = async ({
  address,
  beneficiary,
  holder,
  tokenId,
  network,
  dryRun,
  ...rest
}: TokenRegistryIssueCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistry: TradeTrustToken = await TradeTrustToken__factory.connect(address, wallet);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await tokenRegistry.estimateGas.mint(beneficiary, holder, tokenId),
      network,
    });
    process.exit(0);
  }

  let transaction;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, network, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await tokenRegistry.callStatic.mint(beneficiary, holder, tokenId);
    signale.await(`Sending transaction to pool`);
    transaction = await tokenRegistry.mint(beneficiary, holder, tokenId, { ...gasFees });
  } else {
    await tokenRegistry.callStatic.mint(beneficiary, holder, tokenId);
    signale.await(`Sending transaction to pool`);
    transaction = await tokenRegistry.mint(beneficiary, holder, tokenId);
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
