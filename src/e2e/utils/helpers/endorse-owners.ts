import { isAddress } from "web3-utils";
import { AddressLength, EndStatus, TokenIdLength } from "../constants";
import { extractStatus } from "../shell";
import { isTokenId } from "../token-management";

export const checkE2EEndorseOwner = (results: string): { beneficiary: string; holder: string; tokenId: string } => {
  const statusLine = extractStatus(results, EndStatus.success, "Transferable record with hash ");
  if (statusLine.length <= 0) throw new Error("Minting failed");
  const titleEscrowAddressLine = statusLine[0].lineContent;
  const tokenId = titleEscrowAddressLine.substring(43, 43 + TokenIdLength);
  const beneficiary = titleEscrowAddressLine.substring(176, 176 + AddressLength);
  const holder = titleEscrowAddressLine.substring(248, 248 + AddressLength);

  const beneficiaryIsAddress = isAddress(beneficiary);
  const holderIsAddress = isAddress(holder);
  const isValidTokenId = isTokenId(tokenId);

  if (!beneficiaryIsAddress) throw new Error("Invalid beneficiary address");
  if (!holderIsAddress) throw new Error("Invalid holder address");
  if (!isValidTokenId) throw new Error("Invalid token id");

  return {
    beneficiary,
    holder,
    tokenId,
  };
};
