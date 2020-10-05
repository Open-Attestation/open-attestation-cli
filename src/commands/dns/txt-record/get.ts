import { Argv } from "yargs";
import { error } from "signale";
import { getLogger } from "../../../logger";
import { DnsGetTxtRecordCommand } from "./dns-command.type";
import { getDocumentStoreRecords } from "@govtechsg/dnsprove";
import { OpenAttestationDNSTextRecord } from "@govtechsg/dnsprove/dist/ts/records/dnsTxt";

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
    .option("networkId", {
      description: "Ethereum Network (chain ID) to filter results by",
      type: "number",
    });

export const handler = async (args: DnsGetTxtRecordCommand): Promise<OpenAttestationDNSTextRecord[]> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    const records = await getDocumentStoreRecords(args.location);
    console.table(args.networkId ? records.filter((record) => record.netId == String(args.networkId)) : records);
    return records;
  } catch (e) {
    error(e.message);
  }
  return [];
};
