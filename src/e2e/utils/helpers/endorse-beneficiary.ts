import { isAddress } from "web3-utils";
import { TitleEscrowNominateBeneficiaryCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateEndorseTransferOwnerCommand } from "../commands";
import { AddressLength, defaultRunParameters, EndStatus, receiver, TokenIdLength } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";
import { nominateToken } from "./nominate";

export const defaultTransferBeneficiary = {
  ...defaultRunParameters,
  newBeneficiary: receiver.ethAddress,
};

export const nominateAndEndorseBeneficiary = (
  privateKey: string,
  transferBeneficiary: TitleEscrowNominateBeneficiaryCommand
): void => {
  nominateToken(privateKey, transferBeneficiary);
  endorseBeneficiary(privateKey, transferBeneficiary);
};

export const endorseBeneficiary = (
  privateKey: string,
  transferBeneficiary: TitleEscrowNominateBeneficiaryCommand
): void => {
  const command = generateEndorseTransferOwnerCommand(transferBeneficiary, privateKey);
  const results = run(command);
  checkEndorseBeneficiary(results);
};

export const checkEndorseBeneficiary = (results: string): { beneficiary: string; tokenId: string } => {
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
