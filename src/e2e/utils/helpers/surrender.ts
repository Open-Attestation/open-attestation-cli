import { mintE2ETokenRegistry } from ".";
import { BaseTitleEscrowCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateSurrenderCommand } from "../commands";
import { defaultRunParameters, EndStatus, owner, TokenIdLength, TokenInfo } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";

const defaultE2ETitleEscrow = {
  ...defaultRunParameters,
  beneficiary: owner.ethAddress,
  holder: owner.ethAddress,
};

export const mintSurrenderE2EToken = (privateKey: string, tokenRegistryAddress?: string): TokenInfo => {
  const tokenDetails = mintE2ETokenRegistry(privateKey, tokenRegistryAddress);
  const { tokenRegistry, tokenId } = tokenDetails;
  const surrenderParameter: BaseTitleEscrowCommand = {
    ...defaultE2ETitleEscrow,
    tokenRegistry: tokenRegistry,
    tokenId: tokenId,
  };
  surrenderE2EToken(privateKey, surrenderParameter);
  return tokenDetails;
};

export const surrenderE2EToken = (privateKey: string, surrenderParameter: BaseTitleEscrowCommand): void => {
  const command = generateSurrenderCommand(surrenderParameter, privateKey);
  const results = run(command);
  checkE2ESurrenderSuccess(results);
};

export const checkE2ESurrenderSuccess = (results: string): { tokenId: string } => {
  const statusLine = extractStatus(results, EndStatus.success, "Transferable record with hash ");
  if (statusLine.length <= 0) throw new Error("Nomination failed");
  const titleEscrowAddressLine = statusLine[0].lineContent;
  const tokenId = titleEscrowAddressLine.substring(43, 43 + TokenIdLength);

  const isValidTokenId = isTokenId(tokenId);

  if (!isValidTokenId) throw new Error("Invalid token id");

  return {
    tokenId,
  };
};
