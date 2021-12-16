import fs from "fs";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { CreateConfigCommand } from "./config.type";
import { withWalletOption, isWalletOption } from "../shared";
import { create } from "../../implementations/config/create";

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
      .option("config-type", {
        type: "string",
        description: "type of config to create (i.e. tradetrust)",
        normalize: true,
        choices: ["tradetrust"],
      })
      .conflicts("config-type", "config-template-path")
      .check((argv) => {
        if (!isWalletOption(argv))
          throw new Error(
            "Please provide a encrypted wallet path, you can run the wallet creation command to obtain the wallet.json before proceeding."
          );
        if (argv["config-type"] || argv["config-template-path"]) return true;
        else {
          throw new Error("Please provide either a config-type or a config template path");
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
