import fs from "fs";
import signale from "signale";
import { obfuscateDocument, verifySignature } from "@tradetrust-tt/tradetrust";

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
