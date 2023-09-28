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
  sessionToken: string;
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

export interface GasPriceScale {
  gasPriceScale: number;
  fixedPrice?: number;
}
export interface GasOption extends GasPriceScale {
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
  yargs
    .option("priority", {
      alias: "gasPriceScale",
      type: "number",
      default: 1,
      demandOption: false,
      description: "Scale for estimated priority fees (gasPriceScale * estimated Gas Price)",
    })
    .option("fixedPrice", {
      type: "number",
      demandOption: false,
      description: "Fixed gas price to use",
    })
    .option("dry-run", {
      alias: "dr",
      type: "boolean",
      default: false,
      description: "Provide estimated transaction fees without actually sending them",
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
    .option("session-token", {
      type: "string",
      description:
        "AWS Session token. Example: IQoJb3JpZ2luX2VjEDsaDmFwLXNvdXRoZWFzdC0xIkcwRQIgR7ap3CSpkQ0U1IA1KYebxXB5pmpvHd59pTZRsmXzC5MCIQCij0GELbTj8R30Wcho1NgZq3q/dSLoFm2gD9WOFRxamiqeAggkEAMaDDczMzQ4NzYyMjk4MiIMiXeHIetiIMVm85SUKvsBTlIStOhlYNlNJmQHeiumoWXztNuksDK9/pEpam5ZALdi9TI6PJkSuAq+vd7c+ecMC7gN0Fs8sCkM5AjgG7x/WE+81tcOBq/oNF71drfViT5w7/mcBoElSEVUUjQx1oKWfcBLWD/tXu0593hPOi2dHdoG83/6KEgyaNrkpWQdTLK5zUTmtDYLsyoKwZEbGEulUK11WCfbCctJWtlk9RXHdDgbgDP2PzJpeuET4CV21GMX1jsnMeeRNhFX5dqy3+FMIjsAFiWGuE0Q7Fnyjrb/YQVG5BL3LqvYdJGI4HUT/fKtQrWS+skxCm1divsLAhl9+Z0GQ8WDgR3W4akwjt64oQY6nQFjnkWLSBf+OXpkWi1IzPPAqx09srAJiNmz8J+7kdHSLjr5IrKh1hzimxtVNkPX+22ahdmE5m4o5oJm1lgZSLmfYdmvifK76E8y247deFRl4Q0Z+75PDjriw1i4QJcg+USGcFJN6O/dOw5S4if/eYbPaoRBLQOAMYBYjr4aZ3TuMmMHNgMRLBKtQ8fVPpslU2L6XOPRkVR1RejSbII5",
    })
    .option("kms-key-id", {
      type: "string",
      description:
        "AWS KMS key id. Example: arn:aws:kms:us-west-2:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab",
    });

export const withNetworkAndWalletSignerOption = (yargs: Argv): Argv =>
  withNetworkOption(withAwsKmsSignerOption(withWalletOption(withPrivateKeyOption(yargs))));
