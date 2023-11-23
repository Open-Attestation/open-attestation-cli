import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import signale, { success, info } from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreTransferOwnershipCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getGasFees } from "../../utils";
import { getRoleString } from "./document-store-roles";
import { BigNumber } from "ethers";
import { getEtherscanAddress } from "../../utils";

const { trace } = getLogger("document-store:transfer-ownership");

export const transferDocumentStoreOwnership = async ({
  address,
  newOwner,
  network,
  dryRun,
  ...rest
}: DocumentStoreTransferOwnershipCommand): Promise<{
  grantTransaction: Promise<TransactionReceipt>;
  revokeTransaction: Promise<TransactionReceipt>;
}> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  const ownerAddress = await wallet.getAddress();
  const roleString = await getRoleString(documentStore, "admin");
  if (dryRun) {
    const grantRoleGas: BigNumber = await documentStore.estimateGas.grantRole(roleString, newOwner);
    const revokeRoleGas: BigNumber = await documentStore.estimateGas.revokeRole(roleString, ownerAddress);
    await dryRunMode({
      estimatedGas: grantRoleGas.add(revokeRoleGas),
      network,
    });
    process.exit(0);
  }
  const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
  trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
  trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
  signale.await(`Sending transaction to pool`);
  await documentStore.callStatic.grantRole(roleString, newOwner, { ...gasFees });
  const grantTransaction = await documentStore.grantRole(roleString, newOwner, { ...gasFees });
  success(`Document store ${address}'s ownership has been granted to wallet ${newOwner}`);
  info(`Transaction details at: ${getEtherscanAddress({ network: network })}/tx/${grantTransaction.hash}`);
  trace(`Tx hash: ${grantTransaction.hash}`);
  trace(`Block Number: ${grantTransaction.blockNumber}`);
  await documentStore.callStatic.revokeRole(roleString, ownerAddress, { ...gasFees });
  const revokeTransaction = await documentStore.revokeRole(roleString, ownerAddress, { ...gasFees });
  success(`Document store ${address}'s ownership has been revoked from wallet ${ownerAddress}`);
  info(`Transaction details at: ${getEtherscanAddress({ network: network })}/tx/${revokeTransaction.hash}`);
  trace(`Tx hash: ${revokeTransaction.hash}`);
  trace(`Block Number: ${revokeTransaction.blockNumber}`);
  return { revokeTransaction: revokeTransaction.wait(), grantTransaction: grantTransaction.wait() };
};
