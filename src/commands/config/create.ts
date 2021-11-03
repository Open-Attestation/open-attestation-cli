import {
  IdentityProofType,
  Issuer,
  OpenAttestationDocument,
  RevocationType,
} from "@govtechsg/open-attestation/dist/types/__generated__/schema.2.0";
import fs from "fs";
import path from "path";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { create as createWallet } from "../../implementations/wallet/create";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { handler as createTemporaryDns } from "../dns/txt-record/create";
import { CreateConfigCommand } from "./config.type";
import tradetrustConfig from "./templates/tradetrust.json";
import { withWalletOption } from "../shared";

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

const { trace } = getLogger("config:create");

export const command = "create [options]";

export const describe = "Create a config file";

export const builder = (yargs: Argv): Argv =>
  withWalletOption(
    yargs
      .option("output-dir", {
        alias: "od",
        description: "Write output to a directory",
        type: "string",
        demandOption: true,
      })
      .option("config-template-path", {
        type: "string",
        description: "Path to file containing config template",
        normalize: true,
      })
      .option("config-type", {
        type: "string",
        description: "type of config to create (i.e. tradetrust)",
        normalize: true,
        choices: ["tradetrust"],
      })
      .conflicts("config-type", "config-template-path")
      .check((argv) => {
        if (argv["config-type"] || argv["config-template-path"]) return true;
        throw new Error("Please provide either a config-type or a config template path");
      })
  );

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync(args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    let walletPath = "";
    if (!args.encryptedWalletPath) {
      info(`Wallet file not provided, please enter password to create a new wallet`);
      const createWalletParams = {
        outputFile: path.join(args.outputDir, "wallet.json"),
        fund: "ropsten",
      };
      walletPath = await createWallet(createWalletParams);
      info(`Wallet created at ${walletPath}`);
    }
    const walletFilePath = walletPath || args.encryptedWalletPath;
    const wallet = await readFile(walletFilePath);
    const walletObject = JSON.parse(wallet);

    info(`Wallet detected at ${walletFilePath}`);

    const configFile: ConfigFile = await selectTemplateFile(args);
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
            if (issuer.revocation?.type !== undefined) issuer.revocation.type = "NONE" as RevocationType;
            if (issuer.identityProof?.location !== undefined)
              issuer.identityProof.location = verifiableDocumentDnsDidName;
            if (issuer.identityProof?.key !== undefined)
              issuer.identityProof.key = `did:ethr:0x${walletObject.address}#controller`;
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
    fs.writeFileSync(path.join(args.outputDir, configFileName), JSON.stringify(configFile, null, 2));
    success(`Config file successfully generated at ${highlight(`${args.outputDir}${configFileName}`)}`);
  } catch (e) {
    if (e instanceof TypeError) {
      error(e.message);
    }
  }
};

const selectTemplateFile = async (args: CreateConfigCommand): Promise<ConfigFile> => {
  switch (args.configType) {
    case "tradetrust":
      return tradetrustConfig as ConfigFile;

    default:
      return JSON.parse(await readFile(args.configTemplatePath));
  }
};
