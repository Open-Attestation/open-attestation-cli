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

    factoryAddress?: string;
    tokenImplementationAddress?: string;
    deployerAddress?: string;
  };
