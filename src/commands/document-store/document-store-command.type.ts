import { NetworkAndKeyOption } from "../shared";

export interface DocumentStoreIssueCommand extends NetworkAndKeyOption {
  address: string;
  hash: string;
}

export interface DocumentStoreRevokeCommand extends NetworkAndKeyOption {
  address: string;
  hash: string;
}
