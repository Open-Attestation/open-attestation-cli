import { encryptString } from "@govtechsg/oa-encryption";
import fs from "fs";
import signale from "signale";
import chalk from "chalk";

export const encrypt = (input: string, output: string): void => {
  const { key, ...encryptedDocument } = encryptString(fs.readFileSync(input, "utf8"));
  fs.writeFileSync(output, JSON.stringify(encryptedDocument, null, 2));
  signale.success(`Encrypted document saved to: ${output}`);
  signale.warn(`Here is the key to decrypt the document: don't lose it: ${chalk.hsl(39, 100, 50)(key)}`);
};
