import { TradeTrustErc721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

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
  if (dryRun) {
    const tokenRegistry = await TradeTrustErc721Factory.connect(address, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await tokenRegistry.estimateGas["safeMint(address,uint256)"](to, tokenId),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const erc721 = await TradeTrustErc721Factory.connect(address, wallet);
  await erc721.callStatic["safeMint(address,uint256)"](to, tokenId, { gasPrice: gasPrice.mul(gasPriceScale) });
  // must invoke the function manually, the lib doesn't handle overload functions
  // https://github.com/ethereum-ts/TypeChain/issues/150
  const transaction = await erc721["safeMint(address,uint256)"](to, tokenId, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
