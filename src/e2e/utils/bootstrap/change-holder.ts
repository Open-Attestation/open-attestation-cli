import { isAddress } from "web3-utils";
import { TitleEscrowTransferHolderCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateChangeHolderCommand } from "../commands";
import { AddressLength, EndStatus, network, receiver, TokenIdLength } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";

export const defaultTransferHolder = {
  newHolder: receiver.ethAddress,
  network: network,
  dryRun: false,
};

export const checkChangeHolderSuccess = (results: string): { newHolder: string; tokenId: string } => {
  const statusLine = extractStatus(results, EndStatus.success, "Transferable record with hash ");
  if (statusLine.length <= 0) throw new Error("Change Holder failed");
  const titleEscrowAddressLine = statusLine[0].lineContent;
  const tokenId = titleEscrowAddressLine.substring(43, 43 + TokenIdLength);
  const holder = titleEscrowAddressLine.substring(173, 173 + AddressLength);

  const holderIsAddress = isAddress(holder);
  const isValidTokenId = isTokenId(tokenId);

  if (!holderIsAddress) throw new Error("Invalid holder address");
  if (!isValidTokenId) throw new Error("Invalid token id");

  return {
    newHolder: holder,
    tokenId,
  };
};

export const changeHolderToken = (privateKey: string, transferHolder: TitleEscrowTransferHolderCommand): void => {
  const command = generateChangeHolderCommand(transferHolder, privateKey);
  const results = run(command);
  checkChangeHolderSuccess(results);
};
