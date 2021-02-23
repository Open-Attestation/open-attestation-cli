import fs from "fs";
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
// import { OpenAttestationDocument } from "@govtechsg/open-attestation";
// v2.issuer;
interface ConfigFile {
  wallet: string;
  forms: Form[]; // either Replace this
}

interface Form {
  defaults: {
    issuers: (VerifiableDocumentIssuers | TransferableRecordIssuers)[]; // or replace this with OA types
  };
}
// to delete
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
// to delete
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
    })
    .option("config-type", {
      type: "string",
      description: "type of config to create (i.e. tradetrust)",
      normalize: true,
      choices: ["tradetrust"],
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
        outputFile: `${args.outputDir}`,
        fund: "ropsten",
      };
      walletPath = await createWallet(createWalletParams);
      info(`Wallet created at ${walletPath}`);
    }
    const walletFilePath = walletPath ? walletPath : args.encryptedWalletPath;
    const wallet = await readFile(walletFilePath);
    const walletObject = JSON.parse(wallet);

    const configFile: ConfigFile = JSON.parse(
      await readFile(
        args.configTemplatePath ? args.configTemplatePath : "src/commands/config/__tests__/initial-config.json"
      )
    );
    configFile.wallet = wallet;

    const formsInTemplate = configFile.forms;
    let documentStoreAddress = "";
    let tokenRegistryAddress = "";
    let verifiableDocumentDnsTxtName = "";
    let verifiableDocumentDnsDidName = "";
    let tokenRegistryDnsName = "";
    let dnsTxt = false;
    let dnsDid = false;
    const typeOfDocuments = formsInTemplate.map((formTemplate: any) => formTemplate.type);
    if (typeOfDocuments.includes("VERIFIABLE_DOCUMENT")) {
      // ---- OLD CODE ------
      // info(`Enter password to continue deployment of Document Store`);
      // const deployDocumentStoreParams = {
      //   encryptedWalletPath: walletFilePath,
      //   network: "ropsten",
      //   gasPriceScale: 1,
      //   dryRun: false,
      //   storeName: "Document Store",
      // };
      // const documentStore = await deployDocumentStore(deployDocumentStoreParams);
      // documentStoreAddress = documentStore.contractAddress;
      // success(`Document store deployed, address: ${highlight(documentStoreAddress)}`);
      // --------------------

      // this flow is for DNS-TXT only
      const documentStoreTemporaryDnsParams = {
        networkId: 3,
        address: "",
        publicKey: "",
        sandboxEndpoint: "https://sandbox.openattestation.com",
      };
      // info(`Creating temporary DNS for verifiable documents`);
      // verifiableDocumentDnsTxtName = (await createTemporaryDns(documentStoreTemporaryDnsParams)) || "";

      formsInTemplate.forEach((form: any) => {
        if (form.defaults.issuers[0].identityProof.type === "DNS-TXT") {
          dnsTxt = true;
        }
        if (form.defaults.issuers[0].identityProof.type === "DNS-DID") {
          dnsDid = true;
        }
      });

      if (dnsTxt) {
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
        documentStoreTemporaryDnsParams.address = documentStoreAddress;
        documentStoreTemporaryDnsParams.publicKey = "";
        console.log(documentStoreTemporaryDnsParams);
        info(`Creating DNS-TXT record..`);
        verifiableDocumentDnsTxtName = (await createTemporaryDns(documentStoreTemporaryDnsParams)) || "";
      }

      if (dnsDid) {
        documentStoreTemporaryDnsParams.address = "";
        documentStoreTemporaryDnsParams.publicKey = `did:ethr:0x${walletObject.address}#controller`;
        console.log(documentStoreTemporaryDnsParams);

        info(`Creating DNS-DID record..`);
        verifiableDocumentDnsDidName = (await createTemporaryDns(documentStoreTemporaryDnsParams)) || "";
      }
    }
    if (typeOfDocuments.includes("TRANSFERABLE_RECORD")) {
      info(`Enter password to continue deployment of Token Registry`);
      const deployTokenRegistryParams = {
        registryName: "Demo Token Registry",
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
      const tokenRegistryTemporaryDnsParams = {
        networkId: 3,
        address: tokenRegistryAddress,
        sandboxEndpoint: "https://sandbox.openattestation.com",
      };
      tokenRegistryDnsName = (await createTemporaryDns(tokenRegistryTemporaryDnsParams)) || "";
    }

    const updatedForms = [] as any;
    formsInTemplate.forEach((form: any) => {
      let updatedIssuers;
      const updatedForm = form;
      if (form.type === "VERIFIABLE_DOCUMENT") {
        updatedIssuers = form.defaults.issuers.map((issuer: any) => {
          if (issuer.identityProof.type === "DNS-DID") {
            // update using the DNS-DID value from above
            issuer.name = "Demo Issuer";
            issuer.id = `did:ethr:0x${walletObject.address}`; // replace
            issuer.revocation.type = "NONE";
            issuer.identityProof.location = verifiableDocumentDnsDidName; // replace this with the DNS-DID dns name
            issuer.identityProof.key = `did:ethr:0x${walletObject.address}#controller`; // replace
          } else {
            issuer.name = "DEMO STORE";
            issuer.documentStore = documentStoreAddress;
            issuer.identityProof.location = verifiableDocumentDnsTxtName;
          }

          return issuer;
        });
      }
      if (form.type === "TRANSFERABLE_RECORD") {
        updatedIssuers = form.defaults.issuers.map((issuer: any) => {
          issuer.name = "DEMO TOKEN REGISTRY";
          issuer.tokenRegistry = tokenRegistryAddress;
          issuer.identityProof.location = tokenRegistryDnsName;
          return issuer;
        });
      }
      updatedForm.defaults.issuers = updatedIssuers;
      updatedForms.push(updatedForm);
    });
    configFile.forms = updatedForms;

    fs.writeFileSync(`${args.outputDir}/config.json`, JSON.stringify(configFile, null, 2));
    success(`Config file successfully generated`);
  } catch (e) {
    error(e.message);
  }
};
