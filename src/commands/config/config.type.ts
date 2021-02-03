import { DnsCreateTxtRecordCommand } from "../../commands/dns/txt-record/dns-command.type";
import { GasOption } from "../../commands/shared";

export interface CreateConfigCommand extends DnsCreateTxtRecordCommand, GasOption {
  outputFile: string;
  encryptedWalletPath: string;
}
