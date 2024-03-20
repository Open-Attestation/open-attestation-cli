import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRoleCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getRoleString } from "./document-store-roles";
import { getGasFees } from "../../utils";

const { trace } = getLogger("document-store:transfer-ownership");

export const revokeDocumentStoreRole = async ({
  address,
  account,
  network,
  dryRun,
  role,
  ...rest
}: DocumentStoreRoleCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const documentStore = await DocumentStoreFactory.connect(address, wallet);
  const roleString = await getRoleString(documentStore, role);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await documentStore.estimateGas.revokeRole(roleString, account),
      network,
    });
    process.exit(0);
  }
  const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
  trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
  trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
  await documentStore.callStatic.revokeRole(roleString, account);
  signale.await(`Sending transaction to pool`);
  const transaction = await documentStore.revokeRole(roleString, account, { ...gasFees });
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
