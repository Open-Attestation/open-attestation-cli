import { Argv } from "yargs";
import signale, { error } from "signale";
import { getLogger } from "../../../logger";
import { DnsGetTxtRecordCommand } from "./dns-command.type";
import {
  getDnsDidRecords,
  getDocumentStoreRecords,
  OpenAttestationDnsDidRecord,
  OpenAttestationDNSTextRecord,
} from "@govtechsg/dnsprove";

const { trace } = getLogger("dns:txt-record");

export const command = "get [options]";

export const describe = "Get DNS TXT record entries for a specific location";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("location", {
      description: "Domain name to look up for Issuer DNS records",
      type: "string",
      demandOption: true,
    })
    .option("network-id", {
      description: "Ethereum Network (chain ID) to filter results by",
      type: "number",
    });

export const handler = async (
  args: DnsGetTxtRecordCommand
): Promise<(OpenAttestationDNSTextRecord | OpenAttestationDnsDidRecord)[]> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    const allRecords: (OpenAttestationDNSTextRecord | OpenAttestationDnsDidRecord)[] = [];

    const documentStoreRecords = await getDocumentStoreRecords(args.location);
    const filteredRecords = args.networkId
      ? documentStoreRecords.filter((record) => record.netId == String(args.networkId))
      : documentStoreRecords;
    if (filteredRecords.length > 0) {
      allRecords.push(...filteredRecords);
      signale.info("List of document store records:");
      console.table(filteredRecords);
    }
    const dnsDidRecords = await getDnsDidRecords(args.location);
    if (dnsDidRecords.length > 0) {
      allRecords.push(...dnsDidRecords);
      signale.info("List of dns-did records:");
      console.table(dnsDidRecords);
    }

    if (allRecords.length === 0) {
      signale.info("No records found.");
    }
    return allRecords;
  } catch (e) {
    error(e.message);
  }
  return [];
};
