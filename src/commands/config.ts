import { Argv } from "yargs";

export const command = "config <method>";

export const describe =
  "Generate a config file, document store, token registry, wallet and sandbox DNS for sandboxing in document creator";

export const builder = (yargs: Argv): Argv => yargs.commandDir("config", { extensions: ["ts", "js"] });

export const handler = (): void => {};
