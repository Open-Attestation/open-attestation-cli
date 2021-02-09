import fs from "fs";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { deployDocumentStore } from "../../implementations/deploy/document-store/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { create as CreateWallet } from "../../implementations/wallet/create";
import { getLogger } from "../../logger";
import { handler as CreateTemporaryDns } from "../dns/txt-record/create";
import ConfigTemplate from "./config-template.json";
import { CreateConfigCommand } from "./config.type";

const { trace } = getLogger("config:create");

export const command = "create [options]";

export const describe = "Create a generic config file";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("output-dir", {
      alias: "od",
      description: "Write output to a directory",
      type: "string",
      demandOption: true,
    })
    .option("encrypted-wallet-path", {
      alias: "ewp",
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
      info(`Enter password to create wallet`);
      args.outputFile = `${args.outputDir}/wallet.json`;
      args.fund = "ropsten";
      walletPath = await CreateWallet(args);
      info(`Wallet created at ${walletPath}`);
      args.encryptedWalletPath = walletPath;
    }
    const wallet = await readFile(walletPath ? walletPath : args.encryptedWalletPath);

    args.network = "ropsten";
    args.networkId = 3;
    args.gasPriceScale = 1;
    args.dryRun = false;
    args.sandboxEndpoint = "https://sandbox.openattestation.com";

    info(`Enter password to continue deployment of Document Store`);
    args.storeName = "Demo Document Store";
    const documentStore = await deployDocumentStore(args);
    const documentStoreAddress = documentStore.contractAddress;

    info(`Enter password to continue deployment of Token Registry`);
    args.registryName = "Demo Token Registry";
    args.registrySymbol = "DTR";
    const tokenRegistry = await deployTokenRegistry(args);
    const tokenRegistryAddress = tokenRegistry.contractAddress;

    args.address = documentStoreAddress;
    const documentStoreDnsName = await CreateTemporaryDns(args);

    args.address = tokenRegistryAddress;
    const tokenRegistryDnsName = await CreateTemporaryDns(args);

    const configTemplateString = JSON.stringify(ConfigTemplate, null, 2)
      .replace(/"<Wallet string>"/g, JSON.stringify(wallet))
      .replace(/"<Document Store Address>"/g, JSON.stringify(documentStoreAddress))
      .replace(/"<Document Store DNS>"/g, JSON.stringify(documentStoreDnsName))
      .replace(/"<Token Registry Address>"/g, JSON.stringify(tokenRegistryAddress))
      .replace(/"<Token Registry DNS>"/g, JSON.stringify(tokenRegistryDnsName));

    fs.writeFileSync(`${args.outputDir}/demo-config.json`, configTemplateString);
    success(`Config file successfully generated`);
  } catch (e) {
    error(e.message);
  }
};
