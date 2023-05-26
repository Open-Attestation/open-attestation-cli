import { utils, v2, v3 } from "@govtechsg/open-attestation";
import { updateFormV2, updateFormV3 } from "@govtechsg/tradetrust-config";
import fetch from "node-fetch";
import { success } from "signale";
import { NetworkCmdName, supportedNetwork, networkCurrency } from "../../commands/networks";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { highlight } from "../../utils";
import { ConfigFile, Dns, Form } from "./types";
import { Wallet } from "ethers";
import { ConnectedSigner } from "../../implementations/utils/wallet";

interface ConfigWithNetwork {
  configFile: ConfigFile;
  network: NetworkCmdName;
}

export const getConfigWithUpdatedNetwork = ({ configFile, network }: ConfigWithNetwork): ConfigFile => {
  const networkName = supportedNetwork[network].networkName;
  return {
    ...configFile,
    network: networkName,
  };
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
  chain: {
    id: string;
    currency: networkCurrency;
  };
  documentStoreAddress: string;
  tokenRegistryAddress: string;
  dnsVerifiable: Dns;
  dnsDid: Dns;
  dnsTransferableRecord: Dns;
}

export const getConfigWithUpdatedForms = ({
  configFile,
  chain,
  documentStoreAddress,
  tokenRegistryAddress,
  dnsVerifiable,
  dnsDid,
  dnsTransferableRecord,
}: UpdatedForms): ConfigFile => {
  const { wallet, forms } = configFile;

  const updatedForms = forms.map((form: Form) => {
    if (utils.isRawV3Document(form.defaults)) {
      updateFormV3({
        chain,
        wallet,
        form,
        documentStoreAddress,
        tokenRegistryAddress,
        dnsVerifiable: dnsVerifiable || "",
        dnsDid: dnsDid || "",
        dnsTransferableRecord: dnsTransferableRecord || "",
      });
    } else {
      updateFormV2({
        chain,
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

export const getTokenRegistryAddress = async (
  encryptedWalletPath: string,
  passedOnWallet: Wallet | ConnectedSigner,
  network: NetworkCmdName
): Promise<string> => {
  const { contractAddress } = await deployTokenRegistry({
    encryptedWalletPath,
    passedOnWallet,
    network,
    dryRun: false,
    registryName: "Token Registry",
    registrySymbol: "TR",
  });
  success(`Token registry deployed, address: ${highlight(contractAddress)}`);
  return contractAddress;
};

export const getDocumentStoreAddress = async (
  encryptedWalletPath: string,
  passedOnWallet: Wallet | ConnectedSigner,
  network: NetworkCmdName
): Promise<string> => {
  const documentStore = await deployDocumentStore({
    encryptedWalletPath,
    passedOnWallet,
    network,
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
