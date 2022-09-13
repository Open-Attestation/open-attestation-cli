import fs from "fs";
import inquirer from "inquirer";
import { error, info, success } from "signale";
import { Argv } from "yargs";
import { create } from "../../implementations/config/create";
import { getLogger } from "../../logger";
import { highlight } from "../../utils";
import { supportedNetwork } from "../networks";
import { withWalletOption } from "../shared";
import { CreateConfigCommand } from "./config.type";

const { trace } = getLogger("config:create");

export const command = "create [options]";

export const describe = "Create a config file";

export const builder = (yargs: Argv): Argv =>
  withWalletOption(
    yargs.option("output-dir", {
      alias: "od",
      description: "Write output to a directory",
      type: "string",
      demandOption: true,
    })
    // .check((argv) => {
    //   if (!isWalletOption(argv))
    //     throw new Error(
    //       "Please provide a encrypted wallet path, you can run the wallet creation command to obtain the wallet.json before proceeding."
    //     );
    // })
  );

export const handler = async (args: CreateConfigCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!fs.existsSync(args.outputDir)) {
    fs.mkdirSync(args.outputDir);
  }

  try {
    info("Creating a new config file");
    const { password } = await inquirer.prompt({ type: "password", name: "password", message: "Wallet password" });
    args.walletPassword = password;

    const { useTemplateUrl } = await inquirer.prompt({
      type: "confirm",
      name: "useTemplateUrl",
      message: "Using a config template URL?",
    });

    if (useTemplateUrl) {
      const { configTemplateUrl } = await inquirer.prompt({
        type: "input",
        name: "configTemplateUrl",
        message: "Config template URL",
      });
      args.configTemplateUrl = configTemplateUrl;
    } else {
      const { configTemplatePath } = await inquirer.prompt({
        type: "input",
        name: "configTemplatePath",
        message: "Config template path",
      });
      args.configTemplatePath = configTemplatePath;
    }

    const { network } = await inquirer.prompt({
      type: "list",
      name: "network",
      message: "Select Network",
      choices: Object.keys(supportedNetwork),
    });
    args.network = network;

    const outputPath = await create(args);
    success(`Config file successfully created and saved in ${highlight(outputPath)}`);
  } catch (e) {
    if (e instanceof Error) {
      error(e.message);
    }
  }
};
