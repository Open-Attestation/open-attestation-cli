import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type TokenRegistryIssueCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    beneficiary: string;
    holder: string;
    tokenId: string;
  };

export type TokenRegistryRoleCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    role: string;
    recipient: string;
  };

export type TokenRegistrySetRoleAdminCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    role: string;
    adminRole: string;
  };
