import { BaseTitleEscrowCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateAcceptSurrenderCommand } from "../commands";
import { defaultRunParameters, EndStatus, TokenIdLength } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";
import { mintSurrenderE2EToken, surrenderE2EToken } from "./surrender";

export const mintBurntE2EToken = (
  privateKey: string,
  tokenRegistryAddress?: string
): { tokenId: string; tokenRegistry: string } => {
  const { tokenId, tokenRegistry } = mintSurrenderE2EToken(privateKey, tokenRegistryAddress);
  burnSurrenderedE2EToken(privateKey, { tokenRegistry, tokenId, ...defaultRunParameters });
  return { tokenId, tokenRegistry };
};

export const burnSurrenderedE2EToken = (privateKey: string, acceptSurrender: BaseTitleEscrowCommand): void => {
  const command = generateAcceptSurrenderCommand(acceptSurrender, privateKey);
  const results = run(command);
  checkE2ESurrenderAcceptSuccess(results);
};

export const burnE2EToken = (privateKey: string, acceptSurrender: BaseTitleEscrowCommand): void => {
  surrenderE2EToken(privateKey, acceptSurrender);
  burnSurrenderedE2EToken(privateKey, acceptSurrender);
};

export const checkE2ESurrenderAcceptSuccess = (results: string): { tokenId: string } => {
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
