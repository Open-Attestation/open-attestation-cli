export interface TokenRegistryIssueCommand {
  address: string;
  to: string;
  tokenId: string;
  network: string;
  key?: string;
  keyFile?: string;
}
