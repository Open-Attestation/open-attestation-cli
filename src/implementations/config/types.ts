import { v2 } from "@govtechsg/open-attestation";

type WalletEncrypted = {
  type: string;
  encryptedJson: string;
};

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
  wallet: WalletEncrypted;
  forms: Form[];
  documentStorage?: {
    apiKey?: string;
    url: string;
  };
}
