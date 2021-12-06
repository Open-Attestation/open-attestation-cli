import {
  Issuer,
  RevocationType,
  IdentityProofType,
  OpenAttestationDocument,
} from "@govtechsg/open-attestation/dist/types/__generated__/schema.2.0";
import fs from "fs";
import path from "path";
import { info } from "signale";
import { readFile } from "../../implementations/utils/disk";
import { create as createWallet } from "../../implementations/wallet/create";
import tradetrustConfig from "./templates/tradetrust.json";
import { handler as createTemporaryDns } from "../../commands/dns/txt-record/create";
import { CreateConfigCommand } from "../../commands/config/config.type";
import { getDocumentStoreAddress } from "./documentStore";
import { getTokenRegistryAddress } from "./tokenRegistry";

interface ConfigFile {
  wallet: EncryptedWallet | AwsKmsWallet;
  forms: Form[];
}

interface EncryptedWallet {
  type: "ENCRYPTED_JSON";
  encryptedJson: string;
}

interface AwsKmsWallet {
  type: "AWS_KMS";
  accessKeyId: string;
  region: string;
  kmsKeyId: string;
}

interface Form {
  type: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD";
  defaults: OpenAttestationDocument;
}

interface TypesOfForms {
  type: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD";
  identityProofTypes: (IdentityProofType | undefined)[];
}

const sandboxEndpointUrl = "https://sandbox.fyntech.io";

export const create = async ({
  encryptedWalletPath,
  outputDir,
  configType,
  configTemplatePath,
}: CreateConfigCommand): Promise<string> => {
  const walletFilePath = await getWalletPath(encryptedWalletPath, outputDir);
  const wallet = await readFile(walletFilePath);
  const walletObject = JSON.parse(wallet);

  info(`Wallet detected at ${walletFilePath}`);

  const configFile: ConfigFile = await getConfigFile(configType, configTemplatePath);

  const { forms } = configFile;

  const getContractAddress = async (
    typesOfForms: TypesOfForms[],
    formType: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD",
    identityProofType: "DNS-DID" | "DNS-TXT"
  ): Promise<string> => {
    const isValidForm = typesOfForms.some(
      (item: TypesOfForms) =>
        item.type === formType && (<any>Object).values(item.identityProofTypes).includes(identityProofType)
    );

    switch (true) {
      case formType === "VERIFIABLE_DOCUMENT" && identityProofType === "DNS-TXT":
        return await getDocumentStoreAddress(walletFilePath);

      case formType === "VERIFIABLE_DOCUMENT" && identityProofType === "DNS-DID":
        info(`Creating temporary DNS for DID`);
        return (
          (await createTemporaryDns({
            networkId: 3,
            publicKey: `did:ethr:0x${walletObject.address}#controller`,
            sandboxEndpoint: sandboxEndpointUrl,
          })) || ""
        );

      case formType === "TRANSFERABLE_RECORD":
        return await getTokenRegistryAddress(walletFilePath);

      case !isValidForm:
      default:
        return "";
    }
  };

  // loop through the form template to check the type of forms
  const typesOfForms: TypesOfForms[] = forms.map((form) => {
    const identityProofTypes = form.defaults.issuers.map((issuer: Issuer) => issuer.identityProof?.type);
    return {
      type: form.type,
      identityProofTypes: identityProofTypes,
    };
  });

  // generate doc store, token registry and DNS based on the form type in the form template
  const documentStoreAddress = await getContractAddress(typesOfForms, "VERIFIABLE_DOCUMENT", "DNS-TXT");
  const verifiableDocumentDnsTxtName = documentStoreAddress
    ? await createTemporaryDns({ networkId: 3, address: documentStoreAddress, sandboxEndpoint: sandboxEndpointUrl })
    : "";
  const verifiableDocumentDnsDidName = await getContractAddress(typesOfForms, "VERIFIABLE_DOCUMENT", "DNS-DID");
  const tokenRegistryAddress = await getContractAddress(typesOfForms, "TRANSFERABLE_RECORD", "DNS-TXT");
  const tokenRegistryDnsName = tokenRegistryAddress
    ? await createTemporaryDns({ networkId: 3, address: tokenRegistryAddress, sandboxEndpoint: sandboxEndpointUrl })
    : "";

  const updatedForms = updateForms(
    forms,
    documentStoreAddress,
    tokenRegistryAddress,
    walletObject,
    verifiableDocumentDnsTxtName || "",
    verifiableDocumentDnsDidName,
    tokenRegistryDnsName || ""
  );

  const updatedConfigFile = updateConfigFile(configFile, wallet, updatedForms);

  const configFileName = "config.json";
  const outputPath = path.join(outputDir, configFileName);
  fs.writeFileSync(outputPath, JSON.stringify(updatedConfigFile, null, 2));
  return outputPath;
};

const getConfigFile = async (configType: string, configTemplatePath: string): Promise<ConfigFile> => {
  switch (configType) {
    case "tradetrust":
      return tradetrustConfig as ConfigFile;

    default:
      return JSON.parse(await readFile(configTemplatePath));
  }
};

const getWalletPath = async (encryptedWalletPath: string, outputDir: string): Promise<string> => {
  if (encryptedWalletPath) {
    return encryptedWalletPath;
  }
  info(`Wallet file not provided, please enter password to create a new wallet`);
  const createWalletParams = {
    outputFile: path.join(outputDir, "wallet.json"),
    fund: "ropsten",
  };
  const walletPath = await createWallet(createWalletParams);
  info(`Wallet created at ${walletPath}`);
  return walletPath;
};

const updateForms = (
  forms: Form[],
  documentStoreAddress: string,
  tokenRegistryAddress: string,
  walletObject: any,
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

const updateConfigFile = (configFile: ConfigFile, wallet: string, updatedForms: Form[]): ConfigFile => {
  const updatedConfigFile = configFile;
  if (updatedConfigFile.wallet.type === "ENCRYPTED_JSON") {
    updatedConfigFile.wallet.encryptedJson = wallet;
  }
  updatedConfigFile.forms = updatedForms;
  return updatedConfigFile;
};
