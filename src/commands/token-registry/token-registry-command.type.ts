import { NetworkAndKeyOption } from "../shared";

export interface TokenRegistryIssueCommand extends NetworkAndKeyOption {
  address: string;
  to: string;
  tokenId: string;
}
