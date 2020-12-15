export interface DnsCreateTxtRecordCommand {
  address?: string;
  networkId?: number;
  publicKey?: string;
  sandboxEndpoint: string;
}
export interface DnsGetTxtRecordCommand {
  location: string;
  networkId?: number;
}
