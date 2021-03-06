import { GasOption, NetworkAndKeyOption } from "../shared";

export interface DeployDocumentStoreCommand extends NetworkAndKeyOption, GasOption {
  storeName: string;
}

export interface DeployTokenRegistryCommand extends NetworkAndKeyOption, GasOption {
  registryName: string;
  registrySymbol: string;
}

export interface DeployTitleEscrowCreatorCommand extends NetworkAndKeyOption, GasOption {}

export interface DeployTitleEscrowCommand extends NetworkAndKeyOption, GasOption {
  tokenRegistry: string;
  beneficiary: string;
  holder: string;
  titleEscrowFactory?: string;
}
