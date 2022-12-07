import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import {
  BaseTitleEscrowCommand,
  TitleEscrowEndorseTransferOfOwnersCommand,
  TitleEscrowNominateBeneficiaryCommand,
  TitleEscrowTransferHolderCommand,
} from "../../../commands/title-escrow/title-escrow-command.type";
import { TokenRegistryIssueCommand } from "../../../commands/token-registry/token-registry-command.type";

const command = `npm run dev --`;

export const generateDeployTokenRegistryCommand = (
  tokenRegistryParameter: DeployTokenRegistryCommand,
  privateKey: string
): string => {
  return `${command} deploy token-registry "${tokenRegistryParameter.registryName}" ${tokenRegistryParameter.registrySymbol} --network ${tokenRegistryParameter.network} -k ${privateKey} --factory-address ${tokenRegistryParameter.factoryAddress} --token-implementation-address ${tokenRegistryParameter.tokenImplementationAddress} --deployer-address ${tokenRegistryParameter.deployerAddress}`;
};

export const generateDeployDocumentStoreCommand = (
  documentStoreParameter: DeployDocumentStoreCommand,
  privateKey: string
): string => {
  return `${command} deploy document-store "${documentStoreParameter.storeName}"  --network ${documentStoreParameter.network} -k ${privateKey}`;
};

export const generateMintTitleEscrowCommand = (
  titleEscrowParameter: TokenRegistryIssueCommand,
  privateKey: string
): string => {
  return `${command} token-registry mint --address ${titleEscrowParameter.address} --tokenId ${titleEscrowParameter.tokenId} --beneficiary ${titleEscrowParameter.beneficiary} --holder ${titleEscrowParameter.holder} -k ${privateKey} --network ${titleEscrowParameter.network}`;
};

export const generateChangeHolderCommand = (
  changeHolderParameter: TitleEscrowTransferHolderCommand,
  privateKey: string
): string => {
  return `${command} title-escrow change-holder --token-registry ${changeHolderParameter.tokenRegistry} --tokenId ${changeHolderParameter.tokenId} --newHolder ${changeHolderParameter.newHolder} -k ${privateKey} --network ${changeHolderParameter.network}`;
};
export const generateTransferOwnersCommand = (
  transferOwners: TitleEscrowEndorseTransferOfOwnersCommand,
  privateKey: string
): string => {
  return `${command} title-escrow endorse-change-owner --token-registry ${transferOwners.tokenRegistry} --tokenId ${transferOwners.tokenId} --newOwner ${transferOwners.newOwner} --newHolder ${transferOwners.newHolder} -k ${privateKey} --network ${transferOwners.network}`;
};

export const generateEndorseTransferOwnerCommand = (
  transferOwner: TitleEscrowNominateBeneficiaryCommand,
  privateKey: string
): string => {
  return `${command} title-escrow endorse-transfer-owner --token-registry ${transferOwner.tokenRegistry} --tokenId ${transferOwner.tokenId} --newBeneficiary ${transferOwner.newBeneficiary} -k ${privateKey} --network ${transferOwner.network}`;
};

export const generateNominateCommand = (
  nominateParameter: TitleEscrowNominateBeneficiaryCommand,
  privateKey: string
): string => {
  return `${command} title-escrow nominate-change-owner --token-registry ${nominateParameter.tokenRegistry} --tokenId ${nominateParameter.tokenId} --newOwner ${nominateParameter.newBeneficiary} -k ${privateKey} --network ${nominateParameter.network}`;
};

export const generateSurrenderCommand = (surrenderParameter: BaseTitleEscrowCommand, privateKey: string): string => {
  return `${command} title-escrow surrender --token-registry ${surrenderParameter.tokenRegistry} --tokenId ${surrenderParameter.tokenId} -k ${privateKey} --network ${surrenderParameter.network}`;
};

export const generateRejectSurrenderCommand = (
  surrenderParameter: BaseTitleEscrowCommand,
  privateKey: string
): string => {
  return `${command} title-escrow reject-surrendered --token-registry ${surrenderParameter.tokenRegistry} --tokenId ${surrenderParameter.tokenId} --network ${surrenderParameter.network} -k ${privateKey}`;
};
export const generateAcceptSurrenderCommand = (
  surrenderParameter: BaseTitleEscrowCommand,
  privateKey: string
): string => {
  return `${command} title-escrow accept-surrendered --token-registry ${surrenderParameter.tokenRegistry} --tokenId ${surrenderParameter.tokenId} --network ${surrenderParameter.network} -k ${privateKey}`;
};
