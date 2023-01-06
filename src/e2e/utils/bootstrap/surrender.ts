import { mintTokenRegistry } from ".";
import { BaseTitleEscrowCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateSurrenderCommand } from "../commands";
import { defaultRunParameters, EndStatus, owner, TokenIdLength, TokenInfo } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";

const defaultTitleEscrow = {
    ...defaultRunParameters,
    beneficiary: owner.ethAddress,
    holder: owner.ethAddress,
};

export const mintSurrenderToken = (privateKey: string, tokenRegistryAddress?: string): TokenInfo => {
    const tokenDetails = mintTokenRegistry(privateKey, tokenRegistryAddress);
    const { tokenRegistry, tokenId, titleEscrowAddress } = tokenDetails;
    const surrenderParameter: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry: tokenRegistry,
      tokenId: tokenId,
    };
    surrenderToken(privateKey, surrenderParameter);
    return tokenDetails;
  };
  
  
  export const surrenderToken = (privateKey: string, surrenderParameter: BaseTitleEscrowCommand): void => {
    const command = generateSurrenderCommand(surrenderParameter, privateKey);
    const results = run(command);
    checkSurrenderSuccess(results);
  };


export const checkSurrenderSuccess = (results: string) => {
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
  