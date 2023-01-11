import { isAddress } from "web3-utils";
import { mintTokenRegistry } from ".";
import { TitleEscrowNominateBeneficiaryCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateNominateCommand } from "../commands";
import { AddressLength, defaultRunParameters, EndStatus, receiver, TokenIdLength, TokenInfo } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";

export const defaultNominateBeneficiary = {
  ...defaultRunParameters,
  newBeneficiary: receiver.ethAddress,
};

export const mintNominatedToken = (privateKey: string, nominee: string, tokenRegistryAddress?: string): TokenInfo => {
  const tokenDetails = mintTokenRegistry(privateKey, tokenRegistryAddress);
  const { tokenRegistry, tokenId } = tokenDetails;
  const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
    ...defaultNominateBeneficiary,
    tokenId: tokenId,
    tokenRegistry: tokenRegistry,
    newBeneficiary: nominee,
  };
  nominateToken(privateKey, nominateParameter);
  return tokenDetails;
};

export const nominateToken = (privateKey: string, nominateParameter: TitleEscrowNominateBeneficiaryCommand): void => {
  const command = generateNominateCommand(nominateParameter, privateKey);
  const results = run(command);
  checkNominateSuccess(results);
};

export const checkNominateSuccess = (results: string): { nominee: string; tokenId: string } => {
  const statusLine = extractStatus(results, EndStatus.success, "Transferable record with hash ");
  if (statusLine.length <= 0) throw new Error("Nomination failed");
  const titleEscrowAddressLine = statusLine[0].lineContent;
  const tokenId = titleEscrowAddressLine.substring(43, 43 + TokenIdLength);
  const nominee = titleEscrowAddressLine.substring(177, 177 + AddressLength);

  const nomineeIsAddress = isAddress(nominee);
  const isValidTokenId = isTokenId(tokenId);

  if (!nomineeIsAddress) throw new Error("Invalid nominee address");
  if (!isValidTokenId) throw new Error("Invalid token id");

  return {
    nominee,
    tokenId,
  };
};
