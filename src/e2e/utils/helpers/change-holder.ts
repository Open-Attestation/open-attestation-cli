import { isAddress } from "web3-utils";
import { TitleEscrowTransferHolderCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateChangeHolderCommand } from "../commands";
import { AddressLength, defaultRunParameters, EndStatus, receiver, TokenIdLength } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";

export const defaultE2ETransferHolder = {
  ...defaultRunParameters,
  newHolder: receiver.ethAddress,
};

export const checkE2EChangeHolderSuccess = (results: string): { newHolder: string; tokenId: string } => {
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

export const changeHolderE2EToken = (privateKey: string, transferHolder: TitleEscrowTransferHolderCommand): void => {
  const command = generateChangeHolderCommand(transferHolder, privateKey);
  const results = run(command);
  checkE2EChangeHolderSuccess(results);
};
