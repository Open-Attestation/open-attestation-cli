import { BaseTitleEscrowCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateAcceptSurrenderCommand } from "../commands";
import { defaultRunParameters, EndStatus, TokenIdLength } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";
import { mintSurrenderToken, surrenderToken } from "./surrender";

export const mintBurntToken = (
  privateKey: string,
  tokenRegistryAddress?: string
): { tokenId: string; tokenRegistry: string } => {
  const { tokenId, tokenRegistry } = mintSurrenderToken(privateKey, tokenRegistryAddress);
  burnSurrenderedToken(privateKey, { tokenRegistry, tokenId, ...defaultRunParameters });
  return { tokenId, tokenRegistry };
};

export const burnSurrenderedToken = (privateKey: string, acceptSurrender: BaseTitleEscrowCommand): void => {
  const command = generateAcceptSurrenderCommand(acceptSurrender, privateKey);
  const results = run(command);
  checkSurrenderAcceptSuccess(results);
};

export const burnToken = (privateKey: string, acceptSurrender: BaseTitleEscrowCommand): void => {
  surrenderToken(privateKey, acceptSurrender);
  burnSurrenderedToken(privateKey, acceptSurrender);
};

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
