import { NetworkAndKeyOption } from "../shared";

export interface DeployDocumentStoreCommand extends NetworkAndKeyOption {
  storeName: string;
}

export interface DeployTokenRegistryCommand extends NetworkAndKeyOption {
  registryName: string;
  registrySymbol: string;
}

export type DeployTitleEscrowCreatorCommand = NetworkAndKeyOption;

export interface DeployTitleEscrowCommand extends NetworkAndKeyOption {
  tokenRegistry: string;
  beneficiary: string;
  holder: string;
  titleEscrowFactory: string;
}
