import {
  Issuer,
  RevocationType,
  IdentityProofType,
  OpenAttestationDocument,
} from "@govtechsg/open-attestation/dist/types/__generated__/schema.2.0";
import fs from "fs";
import path from "path";
import { info, success } from "signale";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { create as createWallet } from "../../implementations/wallet/create";
import tradetrustConfig from "./templates/tradetrust.json";
import { highlight } from "../../utils";
import { handler as createTemporaryDns } from "../../commands/dns/txt-record/create";
import { CreateConfigCommand } from "../../commands/config/config.type";

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
  let walletPath = "";
  if (!encryptedWalletPath) {
    info(`Wallet file not provided, please enter password to create a new wallet`);
    const createWalletParams = {
      outputFile: path.join(outputDir, "wallet.json"),
      fund: "ropsten",
    };
    walletPath = await createWallet(createWalletParams);
    info(`Wallet created at ${walletPath}`);
  }
  const walletFilePath = walletPath || encryptedWalletPath;
  const wallet = await readFile(walletFilePath);
  const walletObject = JSON.parse(wallet);

  info(`Wallet detected at ${walletFilePath}`);

  const configFile: ConfigFile = await selectTemplateFile(configType, configTemplatePath);
  if (configFile.wallet.type === "ENCRYPTED_JSON") {
    configFile.wallet.encryptedJson = wallet;
  }

  const formsInTemplate = configFile.forms;

  const createDocumentStore = async (): Promise<string> => {
    info(`Enter password to continue deployment of Document Store`);
    const deployDocumentStoreParams = {
      encryptedWalletPath: walletFilePath,
      network: "ropsten",
      gasPriceScale: 1,
      dryRun: false,
      storeName: "Document Store",
    };
    const { contractAddress } = await deployDocumentStore(deployDocumentStoreParams);
    success(`Document store deployed, address: ${highlight(contractAddress)}`);
    return contractAddress;
  };

  const createTokenRegistry = async (): Promise<string> => {
    info(`Enter password to continue deployment of Token Registry`);
    const deployTokenRegistryParams = {
      registryName: "Demo Token Registry",
      registrySymbol: "DTR",
      encryptedWalletPath: walletFilePath,
      network: "ropsten",
      gasPriceScale: 1,
      dryRun: false,
    };
    const { contractAddress } = await deployTokenRegistry(deployTokenRegistryParams);
    success(`Token registry deployed, address: ${highlight(contractAddress)}`);
    return contractAddress;
  };

  const generateDocumentStoreOrTokenRegistryOrDid = async (
    typesOfForms: TypesOfForms[],
    formType: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD",
    didOrTxt: "DNS-DID" | "DNS-TXT"
  ): Promise<string> => {
    const shouldGenerate =
      typesOfForms.filter(
        (item: TypesOfForms) =>
          item.type === formType && (<any>Object).values(item.identityProofTypes).includes(didOrTxt)
      ).length > 0;

    if (!shouldGenerate) return "";
    if (formType === "VERIFIABLE_DOCUMENT" && didOrTxt === "DNS-TXT") return await createDocumentStore();
    if (formType === "VERIFIABLE_DOCUMENT" && didOrTxt === "DNS-DID") {
      info(`Creating temporary DNS for DID`);
      return (
        (await createTemporaryDns({
          networkId: 3,
          publicKey: `did:ethr:0x${walletObject.address}#controller`,
          sandboxEndpoint: sandboxEndpointUrl,
        })) || ""
      );
    }
    if (formType === "TRANSFERABLE_RECORD") return await createTokenRegistry();
    return "";
  };

  // loop through the form template to check the type of forms
  const typesOfForms: TypesOfForms[] = formsInTemplate.map((form) => {
    const identityProofTypes = form.defaults.issuers.map((issuer: Issuer) => issuer.identityProof?.type);
    return {
      type: form.type,
      identityProofTypes: identityProofTypes,
    };
  });

  // generate doc store, token registry and DNS based on the form type in the form template
  const documentStoreAddress = await generateDocumentStoreOrTokenRegistryOrDid(
    typesOfForms,
    "VERIFIABLE_DOCUMENT",
    "DNS-TXT"
  );
  const verifiableDocumentDnsTxtName = documentStoreAddress
    ? await createTemporaryDns({ networkId: 3, address: documentStoreAddress, sandboxEndpoint: sandboxEndpointUrl })
    : "";
  const verifiableDocumentDnsDidName = await generateDocumentStoreOrTokenRegistryOrDid(
    typesOfForms,
    "VERIFIABLE_DOCUMENT",
    "DNS-DID"
  );
  const tokenRegistryAddress = await generateDocumentStoreOrTokenRegistryOrDid(
    typesOfForms,
    "TRANSFERABLE_RECORD",
    "DNS-TXT"
  );
  const tokenRegistryDnsName = tokenRegistryAddress
    ? await createTemporaryDns({ networkId: 3, address: tokenRegistryAddress, sandboxEndpoint: sandboxEndpointUrl })
    : "";

  // replace the values in the forms with the updated value
  formsInTemplate.forEach((form) => {
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

  configFile.forms = formsInTemplate;
  const configFileName = "config.json";
  const outputPath = path.join(outputDir, configFileName);
  fs.writeFileSync(outputPath, JSON.stringify(configFile, null, 2));
  return outputPath;
  // success(`Config file successfully generated at ${highlight(`${outputDir}${configFileName}`)}`);
};

const selectTemplateFile = async (configType: string, configTemplatePath: string): Promise<ConfigFile> => {
  switch (configType) {
    case "tradetrust":
      return tradetrustConfig as ConfigFile;

    default:
      return JSON.parse(await readFile(configTemplatePath));
  }
};
