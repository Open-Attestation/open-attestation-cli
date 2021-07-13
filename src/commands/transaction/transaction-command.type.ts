import { NetworkAndWalletSignerOption } from "../shared";

export type TransactionCancelCommand = NetworkAndWalletSignerOption & {
  nonce?: string;
  gasPrice?: string;
  transactionHash?: string;
};
