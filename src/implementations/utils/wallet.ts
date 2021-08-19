import { readFileSync } from "fs";
import signale from "signale";
import { ethers, getDefaultProvider, providers, Signer, Wallet } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";

import {
  isAwsKmsSignerOption,
  isWalletOption,
  NetworkOption,
  PrivateKeyOption,
  WalletOrSignerOption,
} from "../../commands/shared";
import { readFile } from "./disk";
import inquirer from "inquirer";
import { progress as defaultProgress } from "./progress";
import { AwsKmsSigner } from "ethers-aws-kms-signer";

const getKeyFromFile = (file?: string): undefined | string => {
  return file ? readFileSync(file).toString().trim() : undefined;
};

export type ConnectedSigner = Signer & {
  readonly provider: Provider;
  readonly publicKey?: never;
  readonly privateKey?: never;
};

export const getPrivateKey = ({ keyFile, key }: PrivateKeyOption): string | undefined => {
  if (key) {
    signale.warn(
      "Be aware that by using the `key` parameter, the private key may be stored in your machine's sh history"
    );
    signale.warn(
      "Other options are available: using a file with `key-file` option or using `OA_PRIVATE_KEY` environment variable"
    );
  }
  return key || getKeyFromFile(keyFile) || process.env["OA_PRIVATE_KEY"];
};

export const getWalletOrSigner = async ({
  network,
  progress = defaultProgress("Decrypting Wallet"),
  ...options
}: WalletOrSignerOption & Partial<NetworkOption> & { progress?: (progress: number) => void }): Promise<
  Wallet | ConnectedSigner
> => {
  const provider =
    network === "local"
      ? new providers.JsonRpcProvider()
      : getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  if (isWalletOption(options)) {
    const { password } = await inquirer.prompt({ type: "password", name: "password", message: "Wallet password" });

    const file = await readFile(options.encryptedWalletPath);
    const wallet = await ethers.Wallet.fromEncryptedJson(file, password, progress);
    signale.info("Wallet successfully decrypted");
    return wallet.connect(provider);
  } else if (isAwsKmsSignerOption(options)) {
    const kmsCredentials = {
      accessKeyId: options.accessKeyId, // credentials for your IAM user with KMS access
      secretAccessKey: options.secretAccessKey, // credentials for your IAM user with KMS access
      region: options.region,
      keyId: options.kmsKeyId,
    };

    const signer = new AwsKmsSigner(kmsCredentials).connect(provider);
    if (signer.provider) return signer as ConnectedSigner;
    throw new Error("Unable to attach the provider to the kms signer");
  } else {
    const privateKey = getPrivateKey(options as any);

    if (privateKey) {
      const hexlifiedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      return new Wallet(hexlifiedPrivateKey, provider);
    }
  }
  throw new Error(
    "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
  );
};
