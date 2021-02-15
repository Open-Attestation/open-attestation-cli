import fs from "fs";
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

interface ConfigFile {
  wallet: string;
  forms: {
    defaults: {
      issuers: {
        name: string;
        documentStore?: string;
        tokenRegistry?: string;
        identityProof: {
          type: string;
          location?: string;
        };
      }[];
    };
  }[];
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
    if (!args.encryptedWalletPath) {
      info(`Please enter password to create wallet`);
      const createWalletParams = {
        outputFile: `${args.outputDir}/wallet.json`,
        fund: "ropsten",
      };
      walletPath = await CreatedWalletPath(createWalletParams);
      info(`Wallet created at ${walletPath}`);
    }

    const walletFile = walletPath ? walletPath : args.encryptedWalletPath;
    const wallet = await readFile(walletFile);

    info(`Enter password to continue deployment of Document Store`);
    const deployDocumentStoreParams = {
      encryptedWalletPath: walletFile,
      network: "ropsten",
      gasPriceScale: 1,
      dryRun: false,
      storeName: "Demo Document Store",
    };
    const documentStore = await deployDocumentStore(deployDocumentStoreParams);
    const documentStoreAddress = documentStore.contractAddress;
    success(`Document store deployed, address: ${highlight(documentStoreAddress)}`);

    info(`Enter password to continue deployment of Token Registry`);
    const deployTokenRegistryParams = {
      registryName: "Demo Token Registry",
      registrySymbol: "DTR",
      encryptedWalletPath: walletFile,
      network: "ropsten",
      gasPriceScale: 1,
      dryRun: false,
    };
    const tokenRegistry = await deployTokenRegistry(deployTokenRegistryParams);
    const tokenRegistryAddress = tokenRegistry.contractAddress;
    success(`Token registry deployed, address: ${highlight(documentStoreAddress)}`);

    info(`Creating temporary DNS for document store`);
    const DocumentStoreTemporaryDnsParams = {
      networkId: 3,
      address: documentStoreAddress,
      sandboxEndpoint: "https://sandbox.openattestation.com",
    };
    const documentStoreDnsName = await CreateTemporaryDns(DocumentStoreTemporaryDnsParams);

    info(`Creating temporary DNS for token registry`);
    const TokenRegistryTemporaryDnsParams = {
      networkId: 3,
      address: tokenRegistryAddress,
      sandboxEndpoint: "https://sandbox.openattestation.com",
    };
    const tokenRegistryDnsName = await CreateTemporaryDns(TokenRegistryTemporaryDnsParams);

    const configFile: ConfigFile = ConfigTemplate;
    configFile.wallet = wallet;
    configFile.forms[0].defaults.issuers[0].documentStore = documentStoreAddress;
    configFile.forms[0].defaults.issuers[0].identityProof.location = documentStoreDnsName;
    configFile.forms[1].defaults.issuers[0].tokenRegistry = tokenRegistryAddress;
    configFile.forms[1].defaults.issuers[0].identityProof.location = tokenRegistryDnsName;

    fs.writeFileSync(`${args.outputDir}/demo-config.json`, JSON.stringify(configFile, null, 2));
    success(`Config file successfully generated`);
  } catch (e) {
    error(e.message);
  }
};
