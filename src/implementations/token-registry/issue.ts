import { TradeTrustERC721 } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { connectToTokenRegistry } from "./helpers";

const { trace } = getLogger("token-registry:issue");

export const issueToTokenRegistry = async ({
  address,
  to,
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TokenRegistryIssueCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const { isV3, contract: tokenRegistry } = await connectToTokenRegistry({ address, wallet });
  if (!isV3) {
    throw new Error("Please upgrade to Token Registry V3");
  }
  const V3tokenRegistry = tokenRegistry as TradeTrustERC721;
  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await V3tokenRegistry.estimateGas["mintTitle(address,address,uint256)"](to, to, tokenId),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  await V3tokenRegistry.callStatic["mintTitle(address,address,uint256)"](to, to, tokenId, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  const transaction = await V3tokenRegistry.mintTitle(to, to, tokenId, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
