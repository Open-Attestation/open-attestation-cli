import { decryptString } from "@govtechsg/oa-encryption";
import fs from "fs";
import signale from "signale";

export interface DecryptCommand {
  key: string;
  input: string;
  output: string;
}

export const decrypt = ({ key, input, output }: DecryptCommand): void => {
  const encryptedDocument = fs.readFileSync(input, "utf8");
  const { cipherText, iv, tag, type } = JSON.parse(encryptedDocument);
  if (!cipherText) throw new Error("`cipherText` not found in encrypted document");
  if (!iv) throw new Error("`iv` not found in encrypted document");
  if (!tag) throw new Error("`tag` not found in encrypted document");
  if (!type) throw new Error("`type` not found in encrypted document");
  const decryptedDocument = decryptString({ cipherText, tag, iv, key, type });
  fs.writeFileSync(output, decryptedDocument);
  signale.success(`Decrypted document saved to: ${output}`);
};
