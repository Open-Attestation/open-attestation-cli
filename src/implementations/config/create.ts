import { Issuer, RevocationType } from "@govtechsg/open-attestation/dist/types/__generated__/schema.2.0";
import fs from "fs";
import path from "path";
import { info, success } from "signale";
import { highlight } from "../../utils";
import { readFile } from "../../implementations/utils/disk";
import { handler as createTemporaryDns } from "../../commands/dns/txt-record/create";
import { CreateConfigCommand } from "../../commands/config/config.type";
import { ConfigFile } from "./types";
import { Wallet } from "ethers";
import tradetrustConfig from "./templates/tradetrust.json";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";

const SANDBOX_ENDPOINT_URL = "https://sandbox.fyntech.io";

const getConfigFile = async (configType: string, configTemplatePath: string): Promise<ConfigFile> => {
  switch (configType) {
    case "tradetrust":
      return tradetrustConfig as ConfigFile;
    default:
      return JSON.parse(await readFile(configTemplatePath));
  }
};

const getTokenRegistryAddress = async (encryptedWalletPath: string): Promise<string> => {
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

const getDocumentStoreAddress = async (encryptedWalletPath: string): Promise<string> => {
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

export const create = async ({
  encryptedWalletPath,
  outputDir,
  configType,
  configTemplatePath,
}: CreateConfigCommand): Promise<string> => {
  const wallet = await readFile(encryptedWalletPath);
  const walletObject = JSON.parse(wallet) as Wallet;
  info(`Wallet detected at ${encryptedWalletPath}`);

  const configFile: ConfigFile = await getConfigFile(configType, configTemplatePath);
  const { forms } = configFile;

  const hasTransferableRecord = forms.some((form) => form.type === "TRANSFERABLE_RECORD");
  const hasDocumentStore = forms.some((form) => form.type === "VERIFIABLE_DOCUMENT");
  const hasDid = forms.some((form) =>
    form.defaults.issuers.some((issuer) => issuer.identityProof?.type.includes("DID"))
  );

  let tokenRegistryAddress = "";
  let documentStoreAddress = "";
  let dnsNameTokenRegistry: string | undefined = "";
  let dnsNameVerifiable: string | undefined = "";
  let dnsNameDid: string | undefined = "";

  if (hasTransferableRecord) {
    tokenRegistryAddress = await getTokenRegistryAddress(encryptedWalletPath);
    dnsNameTokenRegistry = await createTemporaryDns({
      networkId: 3,
      address: tokenRegistryAddress,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  if (hasDocumentStore) {
    documentStoreAddress = await getDocumentStoreAddress(encryptedWalletPath);
    dnsNameVerifiable = await createTemporaryDns({
      networkId: 3,
      address: documentStoreAddress,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  if (hasDid) {
    // DID no need deploy any
    dnsNameDid = await createTemporaryDns({
      networkId: 3,
      publicKey: `did:ethr:0x${walletObject.address}#controller`,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  const updatedForms = forms.map((form) => {
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
        if (issuer.identityProof?.location) issuer.identityProof.location = dnsNameTokenRegistry;
        return issuer;
      });
      form.defaults.issuers = updatedIssuers;
    }
    return form;
  });

  const updatedConfigFile = {
    ...configFile,
    wallet: { ...configFile.wallet, encryptedJson: wallet },
    forms: updatedForms,
  }; // TODO: if type is AWS_KMS, should handle
  const outputPath = path.join(outputDir, "config.json");
  fs.writeFileSync(outputPath, JSON.stringify(updatedConfigFile, null, 2));

  return outputPath;
};
