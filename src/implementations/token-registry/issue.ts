import { TradeTrustToken } from "@govtechsg/token-registry/contracts";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { connectToTokenRegistry } from "../utils/connect";

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
  const tokenRegistry: TradeTrustToken = await connectToTokenRegistry(address, wallet);

  if (dryRun) {
    await dryRunMode({
      estimatedGas: await tokenRegistry.estimateGas.mint(beneficiary, holder, tokenId),
      network,
    });
    process.exit(0);
  }

  signale.await(`Sending transaction to pool`);
  await tokenRegistry.callStatic.mint(beneficiary, holder, tokenId);
  const transaction = await tokenRegistry.mint(beneficiary, holder, tokenId);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
