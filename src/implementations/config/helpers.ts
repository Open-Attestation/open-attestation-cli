import { info, success } from "signale";
import { highlight } from "../../utils";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { Issuer, RevocationType } from "@govtechsg/open-attestation/dist/types/__generated__/schema.2.0";
import { ConfigFile, Form } from "./types";
import tradetrustConfig from "./templates/tradetrust.json";
import { readFile } from "../../implementations/utils/disk";
import { Wallet } from "ethers";

export const getDocumentStoreOrTokenRegistryAddress = async (
  walletFilePath: string,
  documentType: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD"
): Promise<string> => {
  const shouldDeployDocumentStore = documentType === "VERIFIABLE_DOCUMENT";

  info(`Enter password to continue deployment of ${shouldDeployDocumentStore ? "Document Store" : "Token Registry"}`);

  const deployDocumentStoreOrTokenRegistry = shouldDeployDocumentStore
    ? await deployDocumentStore({
        encryptedWalletPath: walletFilePath,
        network: "ropsten",
        gasPriceScale: 1,
        dryRun: false,
        storeName: "Document Store",
      })
    : await deployTokenRegistry({
        registryName: "Token Registry",
        registrySymbol: "TR",
        encryptedWalletPath: walletFilePath,
        network: "ropsten",
        gasPriceScale: 1,
        dryRun: false,
      });

  const { contractAddress } = deployDocumentStoreOrTokenRegistry;
  success(`Token registry deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

export const updateConfigFile = (configFile: ConfigFile, wallet: string, updatedForms: Form[]): ConfigFile => {
  const updatedConfigFile = configFile;
  updatedConfigFile.wallet.encryptedJson = wallet;

  updatedConfigFile.forms = updatedForms;
  return updatedConfigFile;
};

export const updateForms = (
  forms: Form[],
  documentStoreAddress: string,
  tokenRegistryAddress: string,
  walletObject: Wallet,
  verifiableDocumentDnsTxtName: string,
  verifiableDocumentDnsDidName: string,
  tokenRegistryDnsName: string
): Form[] => {
  // replace the values in the forms with the updated value
  const updatedForms = forms;
  updatedForms.forEach((form) => {
    if (form.type === "VERIFIABLE_DOCUMENT") {
      const updatedIssuers = form.defaults.issuers.map((issuer: Issuer) => {
        if (issuer.identityProof?.type === "DNS-TXT") {
          issuer.name = "DEMO DOCUMENT STORE";
          issuer.documentStore = documentStoreAddress;
          if (issuer.identityProof?.location) issuer.identityProof.location = verifiableDocumentDnsTxtName;
        } else if (issuer.identityProof?.type === "DNS-DID") {
          issuer.name = "DEMO ISSUER";
          issuer.id = `did:ethr:0x${walletObject.address}`;
          if (issuer.revocation?.type) issuer.revocation.type = "NONE" as RevocationType;
          if (issuer.identityProof?.location) issuer.identityProof.location = verifiableDocumentDnsDidName;
          if (issuer.identityProof?.key) issuer.identityProof.key = `did:ethr:0x${walletObject.address}#controller`;
        }
        return issuer;
      });
      form.defaults.issuers = updatedIssuers;
    }
    if (form.type === "TRANSFERABLE_RECORD") {
      const updatedIssuers = form.defaults.issuers.map((issuer: Issuer) => {
        issuer.name = "DEMO TOKEN REGISTRY";
        issuer.tokenRegistry = tokenRegistryAddress;
        if (issuer.identityProof?.location) issuer.identityProof.location = tokenRegistryDnsName;
        return issuer;
      });
      form.defaults.issuers = updatedIssuers;
    }
  });
  return updatedForms;
};

export const getConfigFile = async (configType: string, configTemplatePath: string): Promise<ConfigFile> => {
  switch (configType) {
    case "tradetrust":
      return tradetrustConfig as ConfigFile;

    default:
      return JSON.parse(await readFile(configTemplatePath));
  }
};
