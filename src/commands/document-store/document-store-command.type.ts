import { GasOption, NetworkAndKeyOption } from "../shared";

export interface DocumentStoreIssueCommand extends NetworkAndKeyOption, GasOption {
  address: string;
  hash: string;
}

export interface DocumentStoreRevokeCommand extends NetworkAndKeyOption, GasOption {
  address: string;
  hash: string;
}
