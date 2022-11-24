import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type DeployDocumentStoreCommand = NetworkAndWalletSignerOption &
  GasOption & {
    storeName: string;
    owner?: string;
  };

export type DeployTokenRegistryCommand = NetworkAndWalletSignerOption &
  GasOption & {
    registryName: string;
    registrySymbol: string;
  };

export type DeployTitleEscrowCreatorCommand = NetworkAndWalletSignerOption & GasOption;

export type DeployTitleEscrowCommand = NetworkAndWalletSignerOption &
  GasOption & {
    tokenRegistry: string;
    beneficiary: string;
    holder: string;
    titleEscrowFactory?: string;
  };
