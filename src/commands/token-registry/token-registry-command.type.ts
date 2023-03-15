import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type TokenRegistryIssueCommand = NetworkAndWalletSignerOption &
  GasOption & {
    address: string;
    beneficiary: string;
    holder: string;
    tokenId: string;
  };
