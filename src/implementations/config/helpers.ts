import { OpenAttestationDocument, v2, v3 } from "@govtechsg/open-attestation";
import fetch from "node-fetch";
import { info, success } from "signale";
import { highlight } from "../../utils";
import { ConfigFile, Form, Dns } from "./types";
import { readFile } from "../../implementations/utils/disk";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";

interface UpdatedWallet {
  configFile: ConfigFile;
  walletStr: string;
}

export const getConfigWithUpdatedWallet = ({ configFile, walletStr }: UpdatedWallet): ConfigFile => {
  return {
    ...configFile,
    wallet: { ...configFile.wallet, encryptedJson: walletStr },
  };
};

interface UpdatedForms {
  configFile: ConfigFile;
  documentStoreAddress: string;
  tokenRegistryAddress: string;
  dnsVerifiable: Dns;
  dnsDid: Dns;
  dnsTransferableRecord: Dns;
}

export const isV3Form = (formDefaults: OpenAttestationDocument): boolean => {
  return "@context" in formDefaults && "openAttestationMetadata" in formDefaults;
};

export const getConfigWithUpdatedForms = ({
  configFile,
  documentStoreAddress,
  tokenRegistryAddress,
  dnsVerifiable,
  dnsDid,
  dnsTransferableRecord,
}: UpdatedForms): ConfigFile => {
  const { wallet, forms } = configFile;
  const { encryptedJson } = wallet;
  const { address } = JSON.parse(encryptedJson);

  const updatedForms = forms.map((form: Form) => {
    if (form.type === "VERIFIABLE_DOCUMENT") {
      // check form for v2 or v3
      if (isV3Form(form.defaults)) {
        const v3Defaults = form.defaults as v3.OpenAttestationDocument;

        if (
          v3Defaults.openAttestationMetadata.identityProof.type === "DNS-DID" ||
          v3Defaults.openAttestationMetadata.identityProof.type === "DID"
        ) {
          v3Defaults.openAttestationMetadata.proof.type = "OpenAttestationProofMethod" as v3.ProofType;
          v3Defaults.openAttestationMetadata.proof.method = "DID" as v3.Method;
          v3Defaults.openAttestationMetadata.proof.value = `did:ethr:0x${address}`;
          v3Defaults.openAttestationMetadata.identityProof.identifier = dnsDid || "";
        } else if (v3Defaults.openAttestationMetadata.identityProof.type === "DNS-TXT") {
          v3Defaults.openAttestationMetadata.proof.value = documentStoreAddress;
          v3Defaults.openAttestationMetadata.identityProof.identifier = dnsVerifiable || "";
        }
        if (v3Defaults.openAttestationMetadata.proof.revocation) {
          v3Defaults.openAttestationMetadata.proof.revocation = {
            type: "NONE" as v3.RevocationType,
          };
        }
      } else {
        const v2Defaults = form.defaults as v2.OpenAttestationDocument;

        const updatedIssuers = v2Defaults.issuers.map((issuer) => {
          if (issuer.identityProof) {
            if (issuer.identityProof.type === "DNS-TXT") {
              issuer.documentStore = documentStoreAddress;
              issuer.identityProof.location = dnsVerifiable;
            } else if (issuer.identityProof.type === "DID" || issuer.identityProof.type === "DNS-DID") {
              issuer.id = `did:ethr:0x${address}`;
              issuer.identityProof.location = dnsDid;
              issuer.identityProof.key = `did:ethr:0x${address}#controller`;
              if (issuer.revocation) {
                issuer.revocation.type = "NONE" as v2.RevocationType;
              }
            }
          }
          return issuer;
        });
        v2Defaults.issuers = updatedIssuers;
      }
    }

    if (form.type === "TRANSFERABLE_RECORD") {
      if (isV3Form(form.defaults)) {
        const v3Defaults = form.defaults as v3.OpenAttestationDocument;

        v3Defaults.openAttestationMetadata.proof.value = tokenRegistryAddress;
        v3Defaults.openAttestationMetadata.identityProof.identifier = dnsTransferableRecord || "";
      } else {
        const v2Defaults = form.defaults as v2.OpenAttestationDocument;

        const updatedIssuers = v2Defaults.issuers.map((issuer) => {
          issuer.tokenRegistry = tokenRegistryAddress;
          if (issuer.identityProof?.location) issuer.identityProof.location = dnsTransferableRecord;
          return issuer;
        });
        v2Defaults.issuers = updatedIssuers;
      }
    }

    return form;
  });

  return {
    ...configFile,
    forms: updatedForms,
  };
};

export const getConfigFile = async (configTemplatePath: string, configTemplateUrl: string): Promise<ConfigFile> => {
  if (configTemplatePath) {
    return JSON.parse(await readFile(configTemplatePath));
  }

  if (configTemplateUrl) {
    const url = new URL(configTemplateUrl);
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }

  throw new Error("Config template reference not provided.");
};

export const getTokenRegistryAddress = async (encryptedWalletPath: string): Promise<string> => {
  info(`Enter password to continue deployment of Token Registry`);
  const tokenRegistry = await deployTokenRegistry({
    encryptedWalletPath,
    network: "ropsten",
    gasPriceScale: 1,
    dryRun: false,
    registryName: "Token Registry",
    registrySymbol: "TR",
  });
  const { contractAddress } = tokenRegistry;
  success(`Token registry deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

export const getDocumentStoreAddress = async (encryptedWalletPath: string): Promise<string> => {
  info(`Enter password to continue deployment of Document Store`);
  const documentStore = await deployDocumentStore({
    encryptedWalletPath,
    network: "ropsten",
    gasPriceScale: 1,
    dryRun: false,
    storeName: "Document Store",
  });
  const { contractAddress } = documentStore;
  success(`Document store deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

export const validate = (forms: Form[]): boolean => {
  const isValidForm = forms.some((form: Form) => {
    const formTypeCheckList = ["TRANSFERABLE_RECORD", "VERIFIABLE_DOCUMENT"];
    const isValidFormType = formTypeCheckList.includes(form.type);
    let isValidIdentityProofType: boolean;

    const identityProofTypeCheckList = ["DNS-TXT", "DNS-DID", "DID"];
    // test for v2/v3 form defaults
    if (isV3Form(form.defaults)) {
      const v3Defaults = form.defaults as v3.OpenAttestationDocument;
      isValidIdentityProofType = identityProofTypeCheckList.includes(
        v3Defaults.openAttestationMetadata.identityProof.type
      );
    } else {
      const v2Defaults = form.defaults as v2.OpenAttestationDocument;
      isValidIdentityProofType = v2Defaults.issuers.some((issuer) => {
        const identityProofType = issuer.identityProof?.type;
        if (identityProofType) {
          return identityProofTypeCheckList.includes(identityProofType);
        }
        return false;
      });
    }

    return isValidFormType && isValidIdentityProofType;
  });

  return isValidForm;
};
