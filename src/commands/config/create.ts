import fs from "fs";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { deployDocumentStore } from "../../implementations/deploy/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { create as CreatedWalletPath } from "../../implementations/wallet/create";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { handler as CreateTemporaryDns } from "../dns/txt-record/create";
import ConfigTemplate from "./config-template.json";
import { CreateConfigCommand } from "./config.type";

interface ConfigFile {
  wallet: string;
  forms: Form[];
}

interface Form {
  defaults: {
    issuers: (VerifiableDocumentIssuers | TransferableRecordIssuers)[];
  };
}
interface VerifiableDocumentIssuers {
  id?: string;
  revocation?: { type: string };
  name: string;
  documentStore?: string;
  identityProof: {
    type: string;
    location?: string;
    key?: string;
  };
}
interface TransferableRecordIssuers {
  name: string;
  tokenRegistry: string;
  identityProof: {
    type: string;
    location?: string;
  };
}

const { trace } = getLogger("config:create");

export const command = "create [options]";

export const describe = "Create a config file";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("output-dir", {
      alias: "od",
      description: "Write output to a directory",
      type: "string",
      demandOption: true,
    })
    .option("encrypted-wallet-path", {
      type: "string",
      description: "Path to file containing wallet.json",
      normalize: true,
    })
    .option("config-template-path", {
      type: "string",
      description: "Path to file containing config template",
      normalize: true,
      demandOption: true,
    });

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync(args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    let walletPath = "";
    if (!args.encryptedWalletPath) {
      info(`Please enter password to create wallet`);
      const createWalletParams = {
        outputFile: `${args.outputDir}/wallet.json`,
        fund: "ropsten",
      };
      walletPath = await CreatedWalletPath(createWalletParams);
      info(`Wallet created at ${walletPath}`);
    }
    const walletFilePath = walletPath ? walletPath : args.encryptedWalletPath;
    const wallet = await readFile(walletFilePath);
    const walletObject = JSON.parse(wallet);

    const configFile: ConfigFile = ConfigTemplate;
    configFile.wallet = wallet;

    const template = JSON.parse(await readFile(args.configTemplatePath));
    const formsInTemplate = template.forms;
    let documentStoreAddress = "";
    let tokenRegistryAddress = "";
    let verifiableDocumentDnsName = "";
    let tokenRegistryDnsName = "";
    const typeOfDocuments = formsInTemplate.map((formTemplate: any) => formTemplate.type);
    if (typeOfDocuments.includes("VERIFIABLE_DOCUMENT")) {
      info(`Enter password to continue deployment of Document Store`);
      const deployDocumentStoreParams = {
        encryptedWalletPath: walletFilePath,
        network: "ropsten",
        gasPriceScale: 1,
        dryRun: false,
        storeName: "Document Store",
      };
      const documentStore = await deployDocumentStore(deployDocumentStoreParams);
      documentStoreAddress = documentStore.contractAddress;
      success(`Document store deployed, address: ${highlight(documentStoreAddress)}`);
      const DocumentStoreTemporaryDnsParams = {
        networkId: 3,
        address: documentStoreAddress,
        sandboxEndpoint: "https://sandbox.openattestation.com",
      };
      info(`Creating temporary DNS for verifiable documents`);
      verifiableDocumentDnsName = (await CreateTemporaryDns(DocumentStoreTemporaryDnsParams)) || "";
    }
    if (typeOfDocuments.includes("TRANSFERABLE_RECORD")) {
      info(`Enter password to continue deployment of Token Registry`);
      const deployTokenRegistryParams = {
        registryName: "Token Registry",
        registrySymbol: "DTR",
        encryptedWalletPath: walletFilePath,
        network: "ropsten",
        gasPriceScale: 1,
        dryRun: false,
      };
      const tokenRegistry = await deployTokenRegistry(deployTokenRegistryParams);
      tokenRegistryAddress = tokenRegistry.contractAddress;
      success(`Token registry deployed, address: ${highlight(tokenRegistryAddress)}`);
      info(`Creating temporary DNS for transferable records`);
      const TokenRegistryTemporaryDnsParams = {
        networkId: 3,
        address: tokenRegistryAddress,
        sandboxEndpoint: "https://sandbox.openattestation.com",
      };
      tokenRegistryDnsName = (await CreateTemporaryDns(TokenRegistryTemporaryDnsParams)) || "";
    }

    formsInTemplate.forEach((form: any) => {
      let updatedIssuers;
      const updatedForm = form;
      if (form.type === "VERIFIABLE_DOCUMENT") {
        updatedIssuers = form.defaults.issuers.map((issuer: any) => {
          if (issuer.identityProof.type === "DNS-DID") {
            issuer.name = "Demo Issuer";
            issuer.id = `did:ethr:0x${walletObject.address}`;
            issuer.revocation.type = "NONE";
            issuer.identityProof.location = verifiableDocumentDnsName;
            issuer.identityProof.key = `did:ethr:0x${walletObject.address}#controller`;
          } else {
            issuer.name = "Demo Issuer";
            issuer.documentStore = documentStoreAddress;
            issuer.identityProof.location = verifiableDocumentDnsName;
          }

          return issuer;
        });
      }
      if (form.type === "TRANSFERABLE_RECORD") {
        updatedIssuers = form.defaults.issuers.map((issuer: any) => {
          issuer.name = "Demo Issuer";
          issuer.tokenRegistry = tokenRegistryAddress;
          issuer.identityProof.location = tokenRegistryDnsName;
          return issuer;
        });
      }
      updatedForm.defaults.issuers = updatedIssuers;
      configFile.forms.push(updatedForm);
    });

    fs.writeFileSync(`${args.outputDir}/config.json`, JSON.stringify(configFile, null, 2));
    success(`Config file successfully generated`);
  } catch (e) {
    error(e.message);
  }
};
