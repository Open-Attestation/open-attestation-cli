import { DnsCreateTxtRecordCommand } from "../../commands/dns/txt-record/dns-command.type";
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
