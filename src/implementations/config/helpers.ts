import { utils, v2, v3 } from "@govtechsg/open-attestation";
import fetch from "node-fetch";
import { info, success } from "signale";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { highlight } from "../../utils";
import { ConfigFile, Dns, Form, Network } from "./types";

interface ConfigWithNetwork {
  configFile: ConfigFile;
  network: Network;
}

export const getConfigWithUpdatedNetwork = ({ configFile, network }: ConfigWithNetwork): ConfigFile => {
  return {
    ...configFile,
    network: network,
  };
};

export const getConfigWithUpdatedDocumentStorage = ({ configFile, network }: ConfigWithNetwork): ConfigFile => {
  if (network === "ropsten") return configFile;
  delete configFile.documentStorage;
  return configFile;
};

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

export const getConfigWithUpdatedForms = ({
  configFile,
  documentStoreAddress,
  tokenRegistryAddress,
  dnsVerifiable,
  dnsDid,
  dnsTransferableRecord,
}: UpdatedForms): ConfigFile => {
  const { wallet, forms } = configFile;

  const updatedForms = forms.map((form: Form) => {
    if (utils.isRawV3Document(form.defaults)) {
      utils.updateFormV3({
        wallet,
        form,
        documentStoreAddress,
        tokenRegistryAddress,
        dnsVerifiable: dnsVerifiable || "",
        dnsDid: dnsDid || "",
        dnsTransferableRecord: dnsTransferableRecord || "",
      });
    } else {
      utils.updateFormV2({
        wallet,
        form,
        documentStoreAddress,
        tokenRegistryAddress,
        dnsVerifiable: dnsVerifiable || "",
        dnsDid: dnsDid || "",
        dnsTransferableRecord: dnsTransferableRecord || "",
      });
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

export const getTokenRegistryAddress = async (encryptedWalletPath: string, configNetwork: string): Promise<string> => {
  info(`Enter password to continue deployment of Token Registry`);
  const tokenRegistry = await deployTokenRegistry({
    encryptedWalletPath,
    network: configNetwork,
    gasPriceScale: 1,
    dryRun: false,
    registryName: "Token Registry",
    registrySymbol: "TR",
  });
  const { contractAddress } = tokenRegistry;
  success(`Token registry deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

export const getDocumentStoreAddress = async (encryptedWalletPath: string, configNetwork: string): Promise<string> => {
  info(`Enter password to continue deployment of Document Store`);
  const documentStore = await deployDocumentStore({
    encryptedWalletPath,
    network: configNetwork,
    gasPriceScale: 1,
    dryRun: false,
    storeName: "Document Store",
  });
  const { contractAddress } = documentStore;
  success(`Document store deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

export const validate = (forms: Form[]): boolean => {
  const isValidForm = forms.map((form: Form) => {
    const formTypeCheckList = ["TRANSFERABLE_RECORD", "VERIFIABLE_DOCUMENT"];
    const isValidFormType = formTypeCheckList.includes(form.type);
    let isValidIdentityProofType: boolean;

    const identityProofTypeCheckList = ["DNS-TXT", "DNS-DID", "DID"];
    // test for v2/v3 form defaults
    if (utils.isRawV3Document(form.defaults)) {
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
  const anyInvalidForm = !isValidForm.some((validForm: boolean) => validForm === false);
  return anyInvalidForm;
};

export const getNetworkId = (networkString: string): number => {
  switch (networkString) {
    case "homestead":
      return 1;

    case "ropsten":
      return 3;

    case "rinkeby":
      return 4;

    case "goerli":
      return 5;

    case "kovan":
      return 42;

    case "matic":
      return 137;

    case "maticmum":
      return 80001;

    default:
      return 1;
  }
};
