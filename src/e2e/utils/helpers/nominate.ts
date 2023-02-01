import { isAddress } from "web3-utils";
import { mintE2ETokenRegistry } from ".";
import { TitleEscrowNominateBeneficiaryCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateNominateCommand } from "../commands";
import { AddressLength, defaultRunParameters, EndStatus, receiver, TokenIdLength, TokenInfo } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";

export const defaultE2ENominateBeneficiary = {
  ...defaultRunParameters,
  newBeneficiary: receiver.ethAddress,
};

export const mintNominatedE2EToken = (
  privateKey: string,
  nominee: string,
  tokenRegistryAddress?: string
): TokenInfo => {
  const tokenDetails = mintE2ETokenRegistry(privateKey, tokenRegistryAddress);
  const { tokenRegistry, tokenId } = tokenDetails;
  const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
    ...defaultE2ENominateBeneficiary,
    tokenId: tokenId,
    tokenRegistry: tokenRegistry,
    newBeneficiary: nominee,
  };
  nominateE2EToken(privateKey, nominateParameter);
  return tokenDetails;
};

export const nominateE2EToken = (
  privateKey: string,
  nominateParameter: TitleEscrowNominateBeneficiaryCommand
): void => {
  const command = generateNominateCommand(nominateParameter, privateKey);
  const results = run(command);
  checkE2ENominateSuccess(results);
};

export const checkE2ENominateSuccess = (results: string): { nominee: string; tokenId: string } => {
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
