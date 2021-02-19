import fs from "fs";
import inquirer from "inquirer";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { deployDocumentStore } from "../../implementations/deploy/document-store/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { create as CreatedWalletPath } from "../../implementations/wallet/create";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { handler as CreateTemporaryDns } from "../dns/txt-record/create";
import ConfigTemplate from "./config-template.json";
import { CreateConfigCommand } from "./config.type";
import transferableRecordFormTemplate from "./transferable-records-forms.json";
import verifiableDocumentFormTemplate from "./verifiable-document-forms.json";

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

const { trace } = getLogger("demo-config:create");

export const command = "create [options]";

export const describe = "Create a demo config file";

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
      demandOption: false,
    });

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync(args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    let walletPath = "";
    const verifiableDocumentForm: Form[] = verifiableDocumentFormTemplate;
    let documentStoreAddress;
    let updatedVerifiableDocumentForm: Form[] = [];
    const transferableRecordForm: Form[] = transferableRecordFormTemplate;
    let updatedTransferableRecordForm: Form[] = [];

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

    // Verifiable documents flow
    const { useVerifiableDocuments } = await inquirer.prompt({
      type: "confirm",
      name: "useVerifiableDocuments",
      message: "Include verifiable document in the config file?",
    });
    if (useVerifiableDocuments) {
      const { useDnsTxt } = await inquirer.prompt({
        type: "confirm",
        name: "useDnsTxt",
        message: "Deploy using DNS-TXT record?",
      });
      let DocumentStoreTemporaryDnsParams;
      if (useDnsTxt) {
        info(`Enter password to continue deployment of Document Store`);
        const deployDocumentStoreParams = {
          encryptedWalletPath: walletFilePath,
          network: "ropsten",
          gasPriceScale: 1,
          dryRun: false,
          storeName: "Demo Document Store",
        };
        const documentStore = await deployDocumentStore(deployDocumentStoreParams);
        documentStoreAddress = documentStore.contractAddress;
        success(`Document store deployed, address: ${highlight(documentStoreAddress)}`);

        DocumentStoreTemporaryDnsParams = {
          networkId: 3,
          address: documentStoreAddress,
          sandboxEndpoint: "https://sandbox.openattestation.com",
        };
      } else {
        DocumentStoreTemporaryDnsParams = {
          networkId: 3,
          publicKey: `did:ethr:0x${walletObject.address}#controller`,
          sandboxEndpoint: "https://sandbox.openattestation.com",
        };
      }
      info(`Creating temporary DNS for verifiable documents`);
      const documentStoreDnsName = await CreateTemporaryDns(DocumentStoreTemporaryDnsParams);
      let formIssuers: VerifiableDocumentIssuers;
      if (useDnsTxt) {
        formIssuers = {
          name: "Demo Issuer",
          documentStore: documentStoreAddress,
          identityProof: {
            type: "DNS-TXT",
            location: documentStoreDnsName,
          },
        };
      } else {
        formIssuers = {
          id: `did:ethr:0x${walletObject.address}`,
          name: "Demo Issuer",
          revocation: {
            type: "NONE",
          },
          identityProof: {
            type: "DNS-DID",
            location: documentStoreDnsName,
            key: `did:ethr:0x${walletObject.address}#controller`,
          },
        };
      }
      updatedVerifiableDocumentForm = verifiableDocumentForm.map((form) => {
        form.defaults.issuers = [formIssuers];
        return form;
      });
    }

    // Transferable records flow
    const { useTransferableRecords } = await inquirer.prompt({
      type: "confirm",
      name: "useTransferableRecords",
      message: "Would you like to add transferable records to the config file?",
    });
    if (useTransferableRecords) {
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
      const tokenRegistryAddress = tokenRegistry.contractAddress;
      success(`Token registry deployed, address: ${highlight(tokenRegistryAddress)}`);
      info(`Creating temporary DNS for transferable records`);
      const TokenRegistryTemporaryDnsParams = {
        networkId: 3,
        address: tokenRegistryAddress,
        sandboxEndpoint: "https://sandbox.openattestation.com",
      };
      const tokenRegistryDnsName = await CreateTemporaryDns(TokenRegistryTemporaryDnsParams);
      const formIssuers = {
        name: "Demo Issuer",
        tokenRegistry: tokenRegistryAddress,
        identityProof: {
          type: "DNS-TXT",
          location: tokenRegistryDnsName,
        },
      } as TransferableRecordIssuers;
      updatedTransferableRecordForm = transferableRecordForm.map((form) => {
        form.defaults.issuers = [formIssuers];
        return form;
      });
    }

    // Constructing the config file.
    const configFile: ConfigFile = ConfigTemplate;
    configFile.wallet = wallet;
    configFile.forms = [...updatedVerifiableDocumentForm, ...updatedTransferableRecordForm];

    fs.writeFileSync(`${args.outputDir}/demo-config.json`, JSON.stringify(configFile, null, 2));
    success(`Config file successfully generated`);
  } catch (e) {
    error(e.message);
  }
};
