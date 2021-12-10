import {
  IdentityProofType,
  OpenAttestationDocument,
} from "@govtechsg/open-attestation/dist/types/__generated__/schema.2.0";

export interface ConfigFile {
  wallet: EncryptedWallet;
  forms: Form[];
}

export interface EncryptedWallet {
  type: "ENCRYPTED_JSON";
  encryptedJson: string;
}

export interface Form {
  type: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD";
  defaults: OpenAttestationDocument;
}

export interface TypesOfForms {
  type: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD";
  identityProofTypes: (IdentityProofType | undefined)[];
}
