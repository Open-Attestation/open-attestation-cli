import { GasOption, NetworkAndWalletSignerOption } from "../shared";
import { Wallet } from "ethers";
import { ConnectedSigner } from "../../implementations/utils/wallet";

export type DeployDocumentStoreCommand = NetworkAndWalletSignerOption &
  GasOption & {
    storeName: string;
    owner?: string;
    passedOnWallet?: Wallet | ConnectedSigner;
  };

export type DeployTokenRegistryCommand = NetworkAndWalletSignerOption &
  GasOption & {
    registryName: string;
    registrySymbol: string;
    passedOnWallet?: Wallet | ConnectedSigner;
    factoryAddress?: string;
    tokenImplementationAddress?: string;
    deployerAddress?: string;
  };
