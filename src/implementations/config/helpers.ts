import { Issuer, RevocationType } from "@govtechsg/open-attestation/dist/types/2.0/types";
import { Wallet } from "ethers";
import fetch from "node-fetch";
import { info, success } from "signale";
import { highlight } from "../../utils";
import { ConfigFile, Form, DnsName } from "./types";
import { readFile } from "../../implementations/utils/disk";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";

interface UpdatedForms {
  forms: Form[];
  walletObject: Wallet;
  documentStoreAddress: string;
  tokenRegistryAddress: string;
  dnsNameVerifiable: DnsName;
  dnsNameDid: DnsName;
  dnsNameTransferableRecord: DnsName;
}

export const getUpdateForms = ({
  forms,
  walletObject,
  documentStoreAddress,
  tokenRegistryAddress,
  dnsNameVerifiable,
  dnsNameDid,
  dnsNameTransferableRecord,
}: UpdatedForms): Form[] => {
  forms.map((form: Form) => {
    if (form.type === "VERIFIABLE_DOCUMENT") {
      const updatedIssuers = form.defaults.issuers.map((issuer: Issuer) => {
        if (issuer.identityProof?.type === "DNS-TXT") {
          issuer.documentStore = documentStoreAddress;
          if (issuer.identityProof?.location) issuer.identityProof.location = dnsNameVerifiable;
        } else if (issuer.identityProof?.type.includes("DID")) {
          issuer.id = `did:ethr:0x${walletObject.address}`;
          if (issuer.revocation?.type) issuer.revocation.type = "NONE" as RevocationType;
          if (issuer.identityProof?.location) issuer.identityProof.location = dnsNameDid;
          if (issuer.identityProof?.key) issuer.identityProof.key = `did:ethr:0x${walletObject.address}#controller`;
        }
        return issuer;
      });
      form.defaults.issuers = updatedIssuers;
    }
    if (form.type === "TRANSFERABLE_RECORD") {
      const updatedIssuers = form.defaults.issuers.map((issuer: Issuer) => {
        issuer.tokenRegistry = tokenRegistryAddress;
        if (issuer.identityProof?.location) issuer.identityProof.location = dnsNameTransferableRecord;
        return issuer;
      });
      form.defaults.issuers = updatedIssuers;
    }
    return form;
  });
  return forms;
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
    const isValidFormType = form.type === "TRANSFERABLE_RECORD" && "VERIFIABLE_DOCUMENT";
    const isValidIdentityProofType = form.defaults.issuers.some(
      (issuer: any) => issuer.identityProof?.type === "DNS-TXT" && "DNS-DID" && "DID"
    );

    return isValidFormType && isValidIdentityProofType;
  });

  return isValidForm;
};
