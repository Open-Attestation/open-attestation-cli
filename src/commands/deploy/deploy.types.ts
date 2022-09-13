import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type DeployDocumentStoreCommand = NetworkAndWalletSignerOption &
  GasOption & {
    storeName: string;
    walletPassword: string;
  };

export type DeployTokenRegistryCommand = NetworkAndWalletSignerOption &
  GasOption & {
    registryName: string;
    registrySymbol: string;
    walletPassword: string;
  };

export type DeployTitleEscrowCreatorCommand = NetworkAndWalletSignerOption & GasOption;

export type DeployTitleEscrowCommand = NetworkAndWalletSignerOption &
  GasOption & {
    tokenRegistry: string;
    beneficiary: string;
    holder: string;
    titleEscrowFactory?: string;
  };
