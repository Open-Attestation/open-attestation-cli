import { isAddress } from "web3-utils";
import { TitleEscrowNominateBeneficiaryCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateEndorseTransferOwnerCommand } from "../commands";
import { AddressLength, defaultRunParameters, EndStatus, receiver, TokenIdLength } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";
import { nominateE2EToken } from "./nominate";

export const defaultE2ETransferBeneficiary = {
  ...defaultRunParameters,
  newBeneficiary: receiver.ethAddress,
};

export const nominateAndEndorseE2EBeneficiary = (
  privateKey: string,
  transferBeneficiary: TitleEscrowNominateBeneficiaryCommand
): void => {
  nominateE2EToken(privateKey, transferBeneficiary);
  endorseE2EBeneficiary(privateKey, transferBeneficiary);
};

export const endorseE2EBeneficiary = (
  privateKey: string,
  transferBeneficiary: TitleEscrowNominateBeneficiaryCommand
): void => {
  const command = generateEndorseTransferOwnerCommand(transferBeneficiary, privateKey);
  const results = run(command);
  checkE2EEndorseBeneficiary(results);
};

export const checkE2EEndorseBeneficiary = (results: string): { beneficiary: string; tokenId: string } => {
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
