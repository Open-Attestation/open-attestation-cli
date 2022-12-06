import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { TitleEscrowEndorseTransferOfOwnersCommand, TitleEscrowNominateBeneficiaryCommand, TitleEscrowtransferOwnerCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { TokenRegistryIssueCommand } from "../../../commands/token-registry/token-registry-command.type";

export const generateDeployTokenRegistryCommand = (
    tokenRegistryParameter: DeployTokenRegistryCommand,
    privateKey: string
): string => {
    return `npm run dev -- deploy token-registry "${tokenRegistryParameter.registryName}" ${tokenRegistryParameter.registrySymbol} -n ${tokenRegistryParameter.network} -k ${privateKey} --factory-address ${tokenRegistryParameter.factoryAddress} --token-implementation-address ${tokenRegistryParameter.tokenImplementationAddress} --deployer-address ${tokenRegistryParameter.deployerAddress}`;
};

export const generateDeployDocumentStoreCommand = (
    documentStoreParameter: DeployDocumentStoreCommand,
    privateKey: string
): string => {
    return `npm run dev -- deploy document-store "${documentStoreParameter.storeName}"  -n ${documentStoreParameter.network} -k ${privateKey}`;
};

export const generateMintTitleEscrowCommand = (
    titleEscrowParameter: TokenRegistryIssueCommand,
    privateKey: string
): string => {
    return `npm run dev -- token-registry mint --address ${titleEscrowParameter.address} --tokenId ${titleEscrowParameter.tokenId} --beneficiary ${titleEscrowParameter.beneficiary} --holder ${titleEscrowParameter.holder} -k ${privateKey} -n ${titleEscrowParameter.network}`;
};

export const generateChangeHolderCommand = (
    changeHolderParameter: TitleEscrowtransferOwnerCommand,
    privateKey: string
): string => {
    return `npm run dev -- title-escrow change-holder --token-registry ${changeHolderParameter.tokenRegistry} --tokenId ${changeHolderParameter.tokenId} --newHolder ${changeHolderParameter.newHolder} -k ${privateKey} --network ${changeHolderParameter.network}`;
};
export const generateTransferOwnersCommand = (
    transferOwners: TitleEscrowEndorseTransferOfOwnersCommand,
    privateKey: string
): string => {
 return `npm run dev -- title-escrow endorse-change-owner --token-registry ${transferOwners.tokenRegistry} --tokenId ${transferOwners.tokenId} --newOwner ${transferOwners.newOwner} --newHolder ${transferOwners.newHolder} -k ${privateKey} --network ${transferOwners.network}`;
}

export const generateEndorseTransferOwnerCommand = (
    transferOwner: TitleEscrowNominateBeneficiaryCommand,
    privateKey: string
): string => {
// const command = `npm run dev -- title-escrow endorse-transfer-owner --token-registry ${transferHolder.tokenRegistry} --tokenId ${transferHolder.tokenId} --newBeneficiary ${transferHolder.newBeneficiary} -k ${owner.privateKey} --network ${transferHolder.network}`;
 return `npm run dev -- title-escrow endorse-transfer-owner --token-registry ${transferOwner.tokenRegistry} --tokenId ${transferOwner.tokenId} --newBeneficiary ${transferOwner.newBeneficiary} -k ${privateKey} --network ${transferOwner.network}`;
}


export const generateNominateCommand = (
    nominateParameter: TitleEscrowNominateBeneficiaryCommand,
    privateKey: string
): string => {
// const command = `npm run dev -- title-escrow nominate-change-owner --token-registry ${transferHolder.tokenRegistry} --tokenId ${transferHolder.tokenId} --newOwner ${transferHolder.newBeneficiary} -k ${owner.privateKey} --network ${transferHolder.network}`;
 return `npm run dev -- title-escrow nominate-change-owner --token-registry ${nominateParameter.tokenRegistry} --tokenId ${nominateParameter.tokenId} --newOwner ${nominateParameter.newBeneficiary} -k ${privateKey} --network ${nominateParameter.network}`;
}

