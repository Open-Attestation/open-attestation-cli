import { PrivateKeyOption } from "../shared";

export interface EncryptWalletCommand extends PrivateKeyOption {
  outputFile: string;
}

export interface CreateWalletCommand {
  outputFile: string;
}
