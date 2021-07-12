import { PrivateKeyOption } from "../shared";

export type EncryptWalletCommand = PrivateKeyOption & {
  outputFile: string;
};

export interface CreateWalletCommand {
  outputFile: string;
  fund?: string;
}

export interface DecryptWalletCommand {
  inputFile: string;
  yes: boolean;
}
