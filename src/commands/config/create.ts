import {
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

interface ConfigFile {
  wallet: string;
  forms: Form[];
}

interface Form {
  type: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD";
  defaults: OpenAttestationDocument;
}

const sandboxEndpointUrl = "https://sandbox.openattestation.com";

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
    })
    .conflicts("config-type", "config-template-path")
    .check((argv) => {
      if (argv["config-type"] || argv["config-template-path"]) return true;
      throw new Error("Please provide either a config-type or a config template path");
    });

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

    const configFile: ConfigFile = JSON.parse(await readFile(selectTemplatePath(args)));
    configFile.wallet = wallet;

    const formsInTemplate = configFile.forms;
    let documentStoreAddress = "";
    let tokenRegistryAddress = "";
    let verifiableDocumentDnsTxtName = "";
    let verifiableDocumentDnsDidName = "";
    let tokenRegistryDnsName = "";

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
      return contractAddress;
    };

    const createTemporaryDnsWithDocumentStore = async (): Promise<string> => {
      documentStoreAddress = await createDocumentStore();
      success(`Document store deployed, address: ${highlight(documentStoreAddress)}`);
      const documentStoreTemporaryDnsParams = {
        networkId: 3,
        address: documentStoreAddress,
        sandboxEndpoint: sandboxEndpointUrl,
      };
      info(`Creating DNS-TXT record..`);
      return (await createTemporaryDns(documentStoreTemporaryDnsParams)) || "";
    };

    const createTemporaryDnsWithDid = async (): Promise<string> => {
      const didTemporaryDnsParams = {
        networkId: 3,
        publicKey: `did:ethr:0x${walletObject.address}#controller`,
        sandboxEndpoint: sandboxEndpointUrl,
      };
      info(`Creating DNS-DID record..`);
      return (await createTemporaryDns(didTemporaryDnsParams)) || "";
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
      return contractAddress;
    };

    const createTemporaryDnsWithTokenRegistry = async (): Promise<string> => {
      tokenRegistryAddress = await createTokenRegistry();
      success(`Token registry deployed, address: ${highlight(tokenRegistryAddress)}`);
      info(`Creating temporary DNS for transferable records`);
      const tokenRegistryTemporaryDnsParams = {
        networkId: 3,
        address: tokenRegistryAddress,
        sandboxEndpoint: sandboxEndpointUrl,
      };
      return (await createTemporaryDns(tokenRegistryTemporaryDnsParams)) || "";
    };

    const updatedForms: Form[] = [];
    for (const form of formsInTemplate) {
      let updatedIssuers: Promise<Issuer>[] = [];
      const updatedForm = form;
      if (form.type === "VERIFIABLE_DOCUMENT") {
        updatedIssuers = form.defaults.issuers.map(async (issuer) => {
          if (issuer.identityProof?.type === "DNS-TXT") {
            if (!verifiableDocumentDnsTxtName)
              verifiableDocumentDnsTxtName = await createTemporaryDnsWithDocumentStore();
            issuer.name = "DEMO STORE";
            issuer.documentStore = documentStoreAddress;
            issuer.identityProof.location = verifiableDocumentDnsTxtName;
          } else if (issuer.identityProof?.type === "DNS-DID") {
            if (!verifiableDocumentDnsDidName) verifiableDocumentDnsDidName = await createTemporaryDnsWithDid();
            issuer.name = "Demo Issuer";
            issuer.id = `did:ethr:0x${walletObject.address}`;
            if (issuer.revocation?.type) issuer.revocation.type = "NONE" as RevocationType;
            issuer.identityProof.location = verifiableDocumentDnsDidName;
            issuer.identityProof.key = `did:ethr:0x${walletObject.address}#controller`;
          }
          return issuer;
        });
      }
      if (form.type === "TRANSFERABLE_RECORD") {
        updatedIssuers = form.defaults.issuers.map(async (issuer: Issuer) => {
          if (!tokenRegistryDnsName) tokenRegistryDnsName = await createTemporaryDnsWithTokenRegistry();
          issuer.name = "DEMO TOKEN REGISTRY";
          issuer.tokenRegistry = tokenRegistryAddress;
          if (issuer.identityProof?.location) issuer.identityProof.location = tokenRegistryDnsName;
          return issuer;
        });
      }
      const awaitedUpdatedIssuers = await Promise.all(updatedIssuers);
      updatedForm.defaults.issuers = awaitedUpdatedIssuers;
      updatedForms.push(updatedForm);
    }

    configFile.forms = updatedForms;
    fs.writeFileSync(path.join(args.outputDir, "config.json"), JSON.stringify(configFile, null, 2));
    success(`Config file successfully generated`);
  } catch (e) {
    error(e.message);
  }
};

const selectTemplatePath = (args: CreateConfigCommand): string => {
  switch (args.configType) {
    case "tradetrust":
      return path.join("src", "commands", "config", "__tests__", "initial-config.json");

    default:
      return args.configTemplatePath;
  }
};
