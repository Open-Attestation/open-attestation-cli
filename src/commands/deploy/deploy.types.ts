export interface DeployDocumentStoreCommand {
  storeName: string;
  network: string;
  key?: string;
  keyFile?: string;
}

export interface DeployTokenRegistryCommand {
  registryName: string;
  registrySymbol: string;
  network: string;
  key?: string;
  keyFile?: string;
}

export interface DeployTitleEscrowCreatorCommand {
  network: string;
  key?: string;
  keyFile?: string;
}

export interface DeployTitleEscrowCommand {
  tokenRegistryAddress: string;
  beneficiary: string;
  holder: string;
  titleEscrowFactoryAddress: string;
  network: string;
  key?: string;
  keyFile?: string;
}