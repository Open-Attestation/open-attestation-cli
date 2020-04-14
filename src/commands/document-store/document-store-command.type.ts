export interface DocumentStoreIssueCommand {
  address: string;
  hash: string;
  network: string;
  key?: string;
  keyFile?: string;
}
