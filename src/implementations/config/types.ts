import { v2 } from "@govtechsg/open-attestation";
import { Wallet } from "ethers";

type WalletEncryptedJson = {
  type: "ENCRYPTED_JSON";
  encryptedJson: string;
};

type WalletOptions = Wallet | WalletEncryptedJson;

export type Dns = string | undefined;

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
  extension?: string;
  fileName?: string;
};

export interface ConfigFile {
  network: "ropsten" | "rinkeby" | "homestead" | "local";
  wallet: WalletOptions;
  forms: Form[];
  documentStorage?: {
    apiKey?: string;
    url: string;
  };
}
