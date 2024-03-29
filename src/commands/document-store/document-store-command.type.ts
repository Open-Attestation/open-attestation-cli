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

export type DocumentStoreTransferOwnershipCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    newOwner: string;
  };

export type DocumentStoreRoleCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    account: string;
    role: string;
  };
