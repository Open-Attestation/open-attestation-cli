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
  };

export type DeployTitleEscrowCreatorCommand = NetworkAndWalletSignerOption & GasOption;

export type DeployTitleEscrowCommand = NetworkAndWalletSignerOption &
  GasOption & {
    tokenRegistry: string;
    beneficiary: string;
    holder: string;
    titleEscrowFactory?: string;
  };
