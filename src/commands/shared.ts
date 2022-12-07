import { Argv } from "yargs";
import { supportedNetwork } from "./networks";

export interface NetworkOption {
  network: string;
}

// it should be a union, because we expect one or the other key. However I couldn't find a clean way to handle this, with the rest of the code
export type PrivateKeyOption =
  | {
      key?: string;
      keyFile?: never;
    }
  | {
      key?: never;
      keyFile?: string;
    };

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isPrivateKeyOption = (option: any): option is PrivateKeyOption => {
  return typeof option?.key === "string" || typeof option?.keyFile === "string";
};

export type AwsKmsSignerOption = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  kmsKeyId: string;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isAwsKmsSignerOption = (option: any): option is AwsKmsSignerOption => {
  return typeof option?.region === "string" && typeof option?.kmsKeyId === "string";
};

export type WalletOption = {
  encryptedWalletPath: string;
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isWalletOption = (option: any): option is WalletOption => {
  return typeof option?.encryptedWalletPath === "string";
};

export type WalletOrSignerOption = Partial<PrivateKeyOption> | Partial<AwsKmsSignerOption> | Partial<WalletOption>;

export interface GasOption {
  dryRun: boolean;
}

export type NetworkAndWalletSignerOption = NetworkOption & (Partial<WalletOption> | Partial<PrivateKeyOption>);

export const withNetworkOption = (yargs: Argv): Argv =>
  yargs.option("network", {
    alias: "n",
    choices: Object.keys(supportedNetwork),
    default: "mainnet",
    description: "Ethereum network to deploy to",
  });
export const withGasPriceOption = (yargs: Argv): Argv =>
  yargs.option("dry-run", {
    alias: "dr",
    type: "boolean",
    default: false,
    description: "Dry run",
  });

export const withPrivateKeyOption = (yargs: Argv): Argv =>
  yargs
    .option("key", {
      alias: "k",
      type: "string",
      description: "Private key of owner account",
    })
    .option("key-file", {
      alias: "f",
      type: "string",
      description: "Path to file containing private key of owner account",
    });

export const withWalletOption = (yargs: Argv): Argv =>
  yargs.option("encrypted-wallet-path", {
    type: "string",
    description: "Path to wallet.json file",
    normalize: true,
    demandOption: true,
  });

export const withAwsKmsSignerOption = (yargs: Argv): Argv =>
  yargs
    .option("access-key-id", {
      type: "string",
      description: "AWS access key id. Example: AKIAIOSFODNN7EXAMPLE",
    })
    .option("secret-access-key", {
      type: "string",
      description: "AWS secret access key. Example: Z8ll+k0CBew8bqqily568Dukv4yaWYOFSOnfui/T",
    })
    .option("region", {
      type: "string",
      description: "AWS region. Example: us-east-2",
    })
    .option("kms-key-id", {
      type: "string",
      description:
        "AWS KMS key id. Example: arn:aws:kms:us-west-2:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab",
    });

export const withNetworkAndWalletSignerOption = (yargs: Argv): Argv =>
  withNetworkOption(withAwsKmsSignerOption(withWalletOption(withPrivateKeyOption(yargs))));
