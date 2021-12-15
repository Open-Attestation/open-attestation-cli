import { v2 } from "@govtechsg/open-attestation";

type WalletEncrypted = {
  type: string;
  encryptedJson: string;
};

type WalletAwsKms = {
  type: string;
  accessKeyId: string;
  region: string;
  kmsKeyId: string;
};

type Wallet = WalletEncrypted | WalletAwsKms;

export type Form = {
  name: string;
  type: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD";
  defaults: v2.OpenAttestationDocument;
  schema: any;
  uiSchema?: any;
  attachments?: {
    allow: boolean;
    accept: string;
  };
};

export interface ConfigFile {
  network: string;
  wallet: Wallet;
  forms: Form[];
  documentStorage?: {
    apiKey?: string;
    url: string;
  };
}
