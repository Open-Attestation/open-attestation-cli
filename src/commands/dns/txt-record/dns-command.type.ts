export interface DnsCreateTxtRecordCommand {
  address?: string;
  networkId?: number;
  publicKey?: string;
}
export interface DnsGetTxtRecordCommand {
  location: string;
  networkId?: number;
}
