import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
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
  return `npm run dev -- token-registry mint --address ${titleEscrowParameter.address} --tokenId ${titleEscrowParameter.tokenId} --beneficiary ${titleEscrowParameter.beneficiary} --holder ${titleEscrowParameter.holder} -k ${privateKey} --n ${titleEscrowParameter.network}`;
};
