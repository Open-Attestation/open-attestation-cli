import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type TokenRegistryIssueCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    to: string;
    tokenId: string;
  };

export type TokenRegistryRoleCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    role: string;
    recipient: string;
  };

export type TokenRegistrySetRoleCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    role: string;
    adminRole: string;
  };
