import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import signale from "signale";
import { getLogger } from "../../logger";
import { getWallet } from "../utils/wallet";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "ethers/providers";

const { trace } = getLogger("token-registry:issue");

export const issueToTokenRegistry = async ({
  address,
  to,
  tokenId,
  network,
  key,
  keyFile,
  gasPriceScale,
  encryptedWalletPath,
  dryRun,
}: TokenRegistryIssueCommand): Promise<TransactionReceipt> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  if (dryRun) {
    const tokenRegistry = await TradeTrustERC721Factory.connect(address, wallet);
    await dryRunMode({
      gasPriceScale: gasPriceScale,
      estimatedGas: await tokenRegistry.estimate.safeMint(to, tokenId, []),
      network,
    });
    process.exit(0);
  }
  const gasPrice = await wallet.provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const erc721 = await TradeTrustERC721Factory.connect(address, wallet);
  // must invoke the function manually, the lib doesn't handle overload functions
  // https://github.com/ethereum-ts/TypeChain/issues/150
  const transaction = await erc721["safeMint(address,uint256)"](to, tokenId, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
