import { readFileSync } from "fs";
import signale from "signale";

interface PrivateKeyParams {
  keyFile?: string;
  key?: string;
}

const getKeyFromFile = (file?: string): undefined | string => {
  return file ? readFileSync(file).toString() : undefined;
};

export const getPrivateKey = ({ keyFile, key }: PrivateKeyParams = {}): string => {
  if (key) {
    signale.warn(
      "Be aware that by using the `key` parameter, the private key may be stored in your machine's sh history"
    );
    signale.warn(
      "Other options are available: using a file with `key-file` option or using `OA_PRIVATE_KEY` environment variable"
    );
  }
  const privateKey = key || getKeyFromFile(keyFile) || process.env["OA_PRIVATE_KEY"];
  if (!privateKey)
    throw new Error("No private key found in OA_PRIVATE_KEY, key or key-file, please supply at least one");
  return privateKey;
};
