import fs from "fs";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { createTempDNS } from "../../implementations/config/create";
import { deployDocumentStore } from "../../implementations/deploy/document-store/document-store";
import { deployTokenRegistry } from "../../implementations/deploy/token-registry/token-registry";
import { readFile } from "../../implementations/utils/disk";
import { create as CreateWallet } from "../../implementations/wallet/create";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
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
      type: "string",
      description: "Path to file containing wallet.json",
      normalize: true,
      demandOption: false,
    });

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync("./" + args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    let walletPath = "";
    if (!args.encryptedWalletPath) {
      info(`Enter password to create wallet`);
      args.outputFile = `${args.outputDir}/wallet.json`;
      walletPath = await CreateWallet(args);
      args.encryptedWalletPath = walletPath;
    }
    const wallet = await readFile(walletPath ? walletPath : args.encryptedWalletPath);

    args.network = "ropsten";
    args.networkId = 3;
    args.gasPriceScale = 1;
    args.dryRun = false;
    args.sandboxEndpoint = "https://sandbox.openattestation.com";

    // const wallet =
    //   '{"address":"709731d94d65b078496937655582401157c8a640","id":"90167e7e-af5c-44b1-a6a3-2525300d1032","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"02004e981623b906938a205c24805bef"},"ciphertext":"06568387223b88fe860bfed23442966124fe38e463fdb5501a0a0f8b9d1519db","kdf":"scrypt","kdfparams":{"salt":"56b3c1e89f4d8a3f76564d4e6f64e832e46729c881764328a4509a2e96c052fe","n":131072,"dklen":32,"p":1,"r":8},"mac":"7611744a709d7cac37379617e8ddd9f134658b7a99b09f55eeaa50b4af6e0d39"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2021-02-01T06-07-08.0Z--709731d94d65b078496937655582401157c8a640","mnemonicCounter":"f2706de1481a3541e7b49885f9a21fa7","mnemonicCiphertext":"7eb14f3487659d100e5dddac1cef72dd","path":"m/44\'/60\'/0\'/0/0","locale":"en","version":"0.1"}}';

    info(`Enter password to continue deployment of Document Store`);
    args.storeName = "Demo Document Store";
    const documentStore = await deployDocumentStore(args);
    const documentStoreAddress = documentStore.contractAddress;

    info(`Enter password to continue deployment of Token Registry`);
    args.registryName = "Demo Token Registry";
    args.registrySymbol = "DTR";
    const tokenRegistry = await deployTokenRegistry(args);
    const tokenRegistryAddress = tokenRegistry.contractAddress;

    // const documentStoreAddress = "0xce604d09941a7601dA58a3A63C0AE025fEd60770";
    args.address = documentStoreAddress;
    const docStoreDns = await createTempDNS(args);
    success(
      `Record created for Document Store at ${highlight(docStoreDns.name)} and will stay valid until ${highlight(
        new Date(docStoreDns.expiryDate).toString()
      )}`
    );

    // const tokenRegistryAddress = "0x46503426b0F2825dbccB2932Fb5d42bF64E255B5";
    args.address = tokenRegistryAddress;
    const tokenRegistryDns = await createTempDNS(args);
    success(
      `Record created for Token Registry at ${highlight(tokenRegistryDns.name)} and will stay valid until ${highlight(
        new Date(tokenRegistryDns.expiryDate).toString()
      )}`
    );

    const configTemplateString = JSON.stringify(ConfigTemplate, null, 2)
      .replace(/"<Wallet string>"/g, JSON.stringify(wallet))
      .replace(/"<Document Store Address>"/g, JSON.stringify(documentStoreAddress))
      .replace(/"<Document Store DNS>"/g, JSON.stringify(docStoreDns.name))
      .replace(/"<Token Registry Address>"/g, JSON.stringify(tokenRegistryAddress))
      .replace(/"<Token Registry DNS>"/g, JSON.stringify(tokenRegistryDns.name));

    fs.writeFileSync(`./${args.outputDir}/demo-config.json`, configTemplateString);
    success(`Config file successfully generated`);
  } catch (e) {
    error(e.message);
  }
};
