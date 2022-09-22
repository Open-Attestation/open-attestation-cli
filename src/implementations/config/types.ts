import { OpenAttestationDocument } from "@govtechsg/open-attestation";

type WalletEncryptedJson = {
  type: "ENCRYPTED_JSON";
  encryptedJson: string;
};

export type Dns = string | undefined;

export type Form = {
  name: string;
  type: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD";
  defaults: OpenAttestationDocument;
  schema: any;
  uiSchema?: any;
  attachments?: {
    allow: boolean;
    accept: string;
  };
  extension?: string;
  fileName?: string;
};

export enum NetworkName {
  local = "local",
  mainnet = "homestead",
  ropsten = "ropsten",
  rinkeby = "rinkeby",
  goerli = "goerli",
  sepolia = "sepolia",
  polygon = "matic",
  mumbai = "maticmum",
}

export type Network = "ropsten" | "rinkeby" | "homestead" | "local" | "goerli" | "sepolia" | "matic" | "maticmum";

export interface ConfigFile {
  network: Network;
  wallet: WalletEncryptedJson;
  forms: Form[];
  documentStorage?: {
    apiKey?: string;
    url: string;
  };
}
