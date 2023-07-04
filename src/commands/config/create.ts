import fs from "fs";
import inquirer from "inquirer";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { create } from "../../implementations/config/create";
import { getLogger } from "../../logger";
import { convertNetworkToNetworkCmdName, highlight } from "../../utils";
import { CreateConfigCommand, SelectNetwork } from "./config.type";

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
    // encrypted wallet path is referenced from command.shared.ts as we need additional properties for this instance.
    .option("encrypted-wallet-path", {
      type: "string",
      description: "Path to wallet.json file",
      normalize: true,
      demandOption: true,
    });

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync(args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    info("Creating a new config file");

    const { useTemplateUrl } = await inquirer.prompt({
      type: "confirm",
      name: "useTemplateUrl",
      message: "Using a config template URL?",
    });
    if (useTemplateUrl) {
      const { configTemplateUrl } = await inquirer.prompt({
        type: "input",
        name: "configTemplateUrl",
        message: "Please enter the config template URL",
      });
      args.configTemplateUrl = configTemplateUrl;
    } else {
      const { configTemplatePath } = await inquirer.prompt({
        type: "input",
        name: "configTemplatePath",
        message: "Please enter the config template path",
      });
      args.configTemplatePath = configTemplatePath;
    }

    const networks = [SelectNetwork.Local, SelectNetwork.Goerli, SelectNetwork.Sepolia, SelectNetwork.Mumbai];
    const { network } = await inquirer.prompt({
      type: "list",
      name: "network",
      message: "Select Network",
      choices: networks,
    });
    args.network = convertNetworkToNetworkCmdName(network);

    const outputPath = await create(args);
    success(`Config file successfully created and saved in ${highlight(outputPath)}`);
  } catch (e) {
    if (e instanceof Error) {
      error(e.message);
    }
  }
};
