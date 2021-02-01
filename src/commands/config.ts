import { Argv } from "yargs";

export const command = "config <method>";

export const describe = "Create config file with generated wallet";

export const builder = (yargs: Argv): Argv => yargs.commandDir("config", { extensions: ["ts", "js"] });

export const handler = (): void => {};
