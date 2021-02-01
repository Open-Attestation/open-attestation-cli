import { Argv } from "yargs";
import signale, { error, info } from "signale";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { CreateConfigFileCommand } from "./config.type";
// import { createConfig } from "../../implementations/config/create";
import { create as createWallet } from "../../implementations/wallet/create";
import fs from "fs";

const { trace } = getLogger("config:create");

export const command = "create [options]";

export const describe = "Create a generic config file";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("output-dir", {
      alias: "od",
      description: "Write output to a directory",
      type: "string",
      conflicts: "output-file",
      demandOption: true,
    })
    .option("fund", {
      description: "Automatically add funds for the specified network",
      type: "string",
      choices: ["ropsten"],
    });

export const handler = async (args: CreateConfigFileCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  args.outputFile = "./config/wallet.json";
  if(!fs.existsSync("./config")) { fs.mkdirSync(args.outputDir); }
  try {
    console.log(`Args: ${JSON.stringify(args, null, 2)}`);
    info(`Creating Config file:`);
    
    info(`Step 1: Create a wallet file`);
    createWallet(args).then(() => {
      info(`Created wallet: ${"..."}`);
      info(`Step 2: Create a document store`);
      // call create doc store function

      //info(`Step 3: Create a transferable record`);
      //call create trans rec function

      //signale.success(`Config file successfully created in ${highlight(args.outputFile)}`)
    });




    
    // info(`Step 2: Create a document store`);
    // info(`Step 3: Create a transferable record`);

    // const outputPath = await createConfig(dArgs);
    // signale.success(`Config file successfully create in ${highlight(outputPath)}`);
  } catch (e) {
    error(e.message);
  }
};