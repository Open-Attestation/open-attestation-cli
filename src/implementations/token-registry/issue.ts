import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { getDefaultProvider, Wallet } from "ethers";
import signale from "signale";
import { getLogger } from "../../logger";
import { getPrivateKey } from "../private-key";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";

const { trace } = getLogger("token-registry:issue");

export const issueToTokenRegistry = async ({
  address,
  to,
  tokenId,
  network,
  key,
  keyFile,
  gasPriceScale
}: TokenRegistryIssueCommand): Promise<{ transactionHash: string }> => {
  const privateKey = getPrivateKey({ key, keyFile });
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  const gasPrice = await provider.getGasPrice();
  signale.await(`Sending transaction to pool`);
  const erc721 = await TradeTrustERC721Factory.connect(address, new Wallet(privateKey, provider));
  // must invoke the function manually, the lib doesn't handle overload functions
  // https://github.com/ethereum-ts/TypeChain/issues/150
  const transaction = await erc721["safeMint(address,uint256)"](to, tokenId, { gasPrice: gasPrice.mul(gasPriceScale) });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
