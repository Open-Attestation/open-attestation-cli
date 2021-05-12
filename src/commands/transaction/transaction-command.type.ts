import { NetworkAndKeyOption } from "../shared";

export interface TransactionCancelCommand extends NetworkAndKeyOption {
  nonce: string;
  gas: string;
}
