import { GasOption, NetworkAndKeyOption } from "../shared";

export interface TokenRegistryIssueCommand extends NetworkAndKeyOption, GasOption {
  address: string;
  to: string;
  tokenId: string;
}
