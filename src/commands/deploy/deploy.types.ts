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
