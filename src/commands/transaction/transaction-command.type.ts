import { NetworkAndKeyOption } from "../shared";

export interface TransactionCancelCommand extends NetworkAndKeyOption {
  nonce?: string;
  gasPrice?: string;
  transactionHash?: string;
}
