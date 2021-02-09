import { DnsCreateTxtRecordCommand } from "../../commands/dns/txt-record/dns-command.type";
import { GasOption } from "../../commands/shared";
import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../deploy/deploy.types";
import { CreateWalletCommand } from "../wallet/wallet.type";

export interface CreateConfigCommand
  extends CreateWalletCommand,
    DeployDocumentStoreCommand,
    DeployTokenRegistryCommand,
    DnsCreateTxtRecordCommand {
  outputDir: string;
  encryptedWalletPath: string;
}

export interface GetWalletProps {
  network: string;
  walletJson: string;
  progress?: (progress: number) => void;
}

export interface DocumentStoreProps {
  storeName: string;
  network: string;
  walletJson: string;
  gasPriceScale: number;
}

export interface TokenRegistryProps {
  registryName: string;
  registrySymbol: string;
  network: string;
  walletJson: string;
  gasPriceScale: number;
}
