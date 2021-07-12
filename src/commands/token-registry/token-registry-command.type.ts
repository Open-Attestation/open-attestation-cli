import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type TokenRegistryIssueCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    to: string;
    tokenId: string;
  };
