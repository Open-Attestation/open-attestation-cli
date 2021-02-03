import { Argv, config, string } from "yargs";
import signale, { error, info, success } from "signale";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { CreateConfigCommand } from "./config.type";
import {
  createWallet,
  deployDocumentStore,
  deployTokenRegistry,
  createTempDNS,
} from "../../implementations/config/create";
import fs from "fs";
import { deploy } from "@govtechsg/document-store";
import { withGasPriceOption, withNetworkAndKeyOption } from "../shared";
import { parseJsonText } from "typescript";
import ConfigTemplate from "./config-template.json";

const { trace } = getLogger("config:create");

export const command = "create [options]";

export const describe = "Create a generic config file";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    yargs
      // .option("output-file", {
      //   alias: "of",
      //   description: "Write output to a directory",
      //   type: "string",
      //   demandOption: true,
      // })
      .option("output-dir", {
        alias: "od",
        description: "Write output to a directory",
        type: "string",
        demandOption: true,
      })
      .option("fund", {
        description: "Automatically add funds for the specified network",
        type: "string",
        choices: ["ropsten"],
      })
      .option("address", {
        alias: "a",
        description: "Contract address of the Document Store or Token Registry",
        default: "",
        type: "string",
        demandOption: false,
      })
      .option("networkId", {
        description: "Ethereum network (chain ID) that this record is for",
        type: "number",
        default: 3,
        demandOption: false,
      })
      .option("sandbox-endpoint", {
        description: "Sandbox address to create record at",
        default: "https://sandbox.openattestation.com",
        alias: "t",
        demandOption: false,
        type: "string",
      })
  );

interface SampleConfigProps {
  network: string;
  wallet: string;
  forms: unknown[];
  documentStorage: {
    apiKey: string;
    url: string;
  };
}

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync("./" + args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    info(`Start generating config file:`);

    info(`Step 1: Create a wallet file`);
    // TODO: uncomment wallet when everything is done
    // const wallet = await createWallet(args);
    const wallet =
      '{"address":"709731d94d65b078496937655582401157c8a640","id":"90167e7e-af5c-44b1-a6a3-2525300d1032","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"02004e981623b906938a205c24805bef"},"ciphertext":"06568387223b88fe860bfed23442966124fe38e463fdb5501a0a0f8b9d1519db","kdf":"scrypt","kdfparams":{"salt":"56b3c1e89f4d8a3f76564d4e6f64e832e46729c881764328a4509a2e96c052fe","n":131072,"dklen":32,"p":1,"r":8},"mac":"7611744a709d7cac37379617e8ddd9f134658b7a99b09f55eeaa50b4af6e0d39"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2021-02-01T06-07-08.0Z--709731d94d65b078496937655582401157c8a640","mnemonicCounter":"f2706de1481a3541e7b49885f9a21fa7","mnemonicCiphertext":"7eb14f3487659d100e5dddac1cef72dd","path":"m/44\'/60\'/0\'/0/0","locale":"en","version":"0.1"}}';

    info(`Step 2: Deploy a document store`);
    // const documentStore = await deployDocumentStore({
    //   storeName: "Document Store",
    //   network: "ropsten",
    //   walletJson: wallet,
    //   gasPriceScale: 1,
    // });
    // const documentStoreAddress = documentStore.contractAddress; // to slot in `forms` later
    // console.log("Document Store: " + documentStoreAddress);

    info(`Step 3: Deploy a token registry`); // open-attestation deploy token-registry "My Sample Token" MST --network ropsten --key 0xWalletPrivateKey
    // const tokenRegistry = await deployTokenRegistry({
    //   registryName: "Token Registry",
    //   registrySymbol: "TR",
    //   network: "ropsten",
    //   walletJson: wallet,
    //   gasPriceScale: 1,
    // });
    // const tokenRegistryAddress = tokenRegistry.contractAddress;
    // console.log("Token Registry: " + tokenRegistry.contractAddress);

    info(`Step 4: Creating a temp domain, assigning both doc store and token registry addresses`); // open-attestation dns txt-record create --address <documentStore> --networkId 3 (run create dns twice, so get 2 domains, 1 is for doc store one for token registry), also extending expiry temp domain name (we should)
    // TODO: Update DS address before their respective DNS creates.
    const documentStoreAddress = "0xce604d09941a7601dA58a3A63C0AE025fEd60770";
    args.address = documentStoreAddress;
    console.log(args.address);
    // const docStoreDns = await createTempDNS(args);
    // console.log("DS DNS Record: " + docStoreDns.name);
    // success(
    //   `Record created for Document Store at ${highlight(docStoreDns.name)} and will stay valid until ${highlight(
    //     new Date(docStoreDns.expiryDate).toString()
    //   )}`
    // );
    // // TODO: Update TR address before their respective DNS creates.
    const tokenRegistryAddress = "0x46503426b0F2825dbccB2932Fb5d42bF64E255B5";
    args.address = tokenRegistryAddress;
    console.log(args.address);
    // const tokenRegistryDns = await createTempDNS(args);
    // console.log("TR DNS Record: " + tokenRegistryDns.name);
    // success(
    //   `Record created for Token Registry at ${highlight(tokenRegistryDns.name)} and will stay valid until ${highlight(
    //     new Date(tokenRegistryDns.expiryDate).toString()
    //   )}`
    // );

    info(`Step 5: Update sample config, location with temp domain, doc store and token registry address accordingly`);

    // const configTemplateString = JSON.stringify(ConfigTemplate, null, 2)
    //   .replace(/"<Wallet string>"/g, JSON.stringify(wallet))
    //   .replace(/"<Document Store DNS>"/g, JSON.stringify(docStoreDns.name))
    //   .replace(/"<Document Store Address>"/g, JSON.stringify(documentStore.contractAddress))
    //   .replace(/"<Token Registry DNS>"/g, JSON.stringify(tokenRegistry.contractAddress))
    //   .replace(/"<Token Registry Address>"/g, JSON.stringify(tokenRegistryDns.name));

    // console.log(configTemplateString);

    // fs.writeFileSync(`./${args.outputDir}/wallet.json`, wallet);
    // fs.writeFileSync(`./${args.outputDir}/demo-config.json`, configTemplateString);
  } catch (e) {
    error(e.message);
  }
};
