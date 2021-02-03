import { DnsCreateTxtRecordCommand } from "../../commands/dns/txt-record/dns-command.type";
import { GasOption, NetworkAndKeyOption } from "../../commands/shared";

export interface CreateConfigCommand extends DnsCreateTxtRecordCommand, GasOption {
  // outputFile: string;
  outputDir: string;
  fund?: string;
}
