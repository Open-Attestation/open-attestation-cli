import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type DocumentStoreIssueCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    hash: string;
  };

export type DocumentStoreRevokeCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    hash: string;
  };
