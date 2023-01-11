import { isAddress } from "web3-utils";
import { AddressLength, EndStatus, TokenIdLength } from "../constants";
import { extractStatus } from "../shell";
import { isTokenId } from "../token-management";

export const checkEndorseTransfer = (results: string): { beneficiary: string; tokenId: string } => {
  const statusLine = extractStatus(results, EndStatus.success, "Transferable record with hash ");
  if (statusLine.length <= 0) throw new Error("Minting failed");
  const titleEscrowAddressLine = statusLine[0].lineContent;
  const tokenId = titleEscrowAddressLine.substring(43, 43 + TokenIdLength);
  const beneficiary = titleEscrowAddressLine.substring(177, 177 + AddressLength);

  const beneficiaryIsAddress = isAddress(beneficiary);
  const isValidTokenId = isTokenId(tokenId);

  if (!beneficiaryIsAddress) throw new Error("Invalid receipient address");
  if (!isValidTokenId) throw new Error("Invalid token id");

  return {
    beneficiary,
    tokenId,
  };
};
