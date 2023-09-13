import { DocumentStoreFactory } from "@govtechsg/document-store";
import signale from "signale";
import { getLogger } from "../../logger";
import { DocumentStoreRoleCommand } from "../../commands/document-store/document-store-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { getRoleString } from "./document-store-roles";

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
  signale.await(`Sending transaction to pool`);
  await documentStore.callStatic.revokeRole(roleString, account);
  const transaction = await documentStore.revokeRole(roleString, account);
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
