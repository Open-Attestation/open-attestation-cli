import { EndStatus, TokenIdLength } from "../constants";
import { extractStatus } from "../shell";
import { isTokenId } from "../token-management";

export const checkSurrenderAcceptSuccess = (results: string): { tokenId: string } => {
  const statusLine = extractStatus(results, EndStatus.success, "Surrendered transferable record with hash ");
  if (statusLine.length <= 0) throw new Error("Surrender Reject failed");
  const titleEscrowAddressLine = statusLine[0].lineContent;
  const tokenId = titleEscrowAddressLine.substring(55, 55 + TokenIdLength);

  const isValidTokenId = isTokenId(tokenId);

  if (!isValidTokenId) throw new Error("Invalid token id");

  return {
    tokenId,
  };
};
