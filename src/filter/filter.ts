import fs from "fs";
import signale from "signale";
import { obfuscateDocument, verifySignature } from "@govtechsg/open-attestation";

interface FilterCommand {
  source: string;
  destination: string;
  fields: string[];
}

export const filter = (input: string, output: string, fields: string[]): void => {
  const documentJson = JSON.parse(fs.readFileSync(input, "utf8"));
  const obfuscatedDocument = obfuscateDocument(documentJson, fields);
  const isValid = verifySignature(obfuscatedDocument);

  if (!isValid) {
    throw new Error("Privacy filtering caused document to fail schema or signature validation");
  } else {
    fs.writeFileSync(output, JSON.stringify(obfuscatedDocument, null, 2));
    signale.success(`Obfuscated document saved to: ${output}`);
  }
};

export const isFilterCommand = (args: any): args is FilterCommand => {
  return args._[0] === "filter";
};
