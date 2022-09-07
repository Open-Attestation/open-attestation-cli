import fs from "fs";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { create } from "../../implementations/config/create";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { isWalletOption, withWalletOption } from "../shared";
import { CreateConfigCommand } from "./config.type";

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
      .option("config-template-url", {
        type: "string",
        description: "URL of config template json",
        normalize: true,
      })
      .option("config-network", {
        type: "string",
        description: "Network of the config file",
        demandOption: true,
        choices: ["ropsten", "homestead", "rinkeby", "matic", "maticmum", "goerli", "kovan"],
      })
      .conflicts("config-template-path", "config-template-url")
      .check((argv) => {
        if (!isWalletOption(argv))
          throw new Error(
            "Please provide a encrypted wallet path, you can run the wallet creation command to obtain the wallet.json before proceeding."
          );
        if (argv["config-template-path"] || argv["config-template-url"]) return true;
        else {
          throw new Error("Please provide either a config-template-path or a config-template-url");
        }
      })
  );

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync(args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    info("Creating a new config file");
    const outputPath = await create(args);
    success(`Config file successfully created and saved in ${highlight(outputPath)}`);
  } catch (e) {
    if (e instanceof Error) {
      error(e.message);
    }
  }
};
