import { Argv } from "yargs";

export const command = "dns <method>";

export const describe = "Invoke a function to interact with DNS";

export const builder = (yargs: Argv): Argv => yargs.commandDir("dns", { extensions: ["ts", "js"] });

export const handler = (): void => {};
