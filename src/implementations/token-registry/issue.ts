import { TradeTrustERC721, TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";

const { trace } = getLogger("token-registry:issue");

export const issueToTokenRegistry = async ({
  address,
  beneficiary,
  holder,
  tokenId,
  network,
  gasPriceScale,
  dryRun,
  ...rest
}: TokenRegistryIssueCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const tokenRegistry: TradeTrustERC721 = await TradeTrustERC721__factory.connect(address, wallet);

  if (dryRun) {
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await tokenRegistry.estimateGas.mint(beneficiary, holder, tokenId),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  await tokenRegistry.callStatic.mint(beneficiary, holder, tokenId, {
    gasPrice: gasPrice.mul(gasPriceScale),
  });
  const transaction = await tokenRegistry.mint(beneficiary, holder, tokenId, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
