import { Argv } from "yargs";
import { error, success } from "signale";
import { getLogger } from "../../../logger";
import { DnsCreateTxtRecordCommand } from "./dns-command.type";
import fetch, { RequestInit } from "node-fetch";
import { highlight } from "../../../utils";

const { trace } = getLogger("dns:txt-record");

export const command = "create [options]";

export const describe = "Creates an Issuer's DNS entry in OpenAttestation's sandbox environment for tutorial purposes";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("address", {
      alias: "a",
      description: "Contract address of the Document Store or Token Registry",
      type: "string",
      demandOption: true
    })
    .option("networkId", {
      description: "Ethereum network (chain ID) that this record is for",
      type: "number",
      demandOption: true
    });

const baseUrl = "https://sandbox.openattestation.com";

const request = (url: string, options?: RequestInit): Promise<any> => {
  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error(`unexpected response ${response.statusText}`);
      }
      return response;
    })
    .then(response => response.json());
};

export const handler = async (args: DnsCreateTxtRecordCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    const { executionId } = await request(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ address: args.address, networkId: args.networkId })
    });
    const { name, expiryDate } = await request(`${baseUrl}/execution/${executionId}`);
    success(
      `Record created at ${highlight(name)} and will stay valid until ${highlight(new Date(expiryDate).toString())}`
    );
    return name;
  } catch (e) {
    error(e.message);
  }
};
