import { Argv } from "yargs";

export const command = "demo-config <method>";

export const describe =
  "Generate a demo config file, document store, token registry, wallet and sandbox DNS for sandboxing in document creator";

export const builder = (yargs: Argv): Argv => yargs.commandDir("demo-config", { extensions: ["ts", "js"] });

export const handler = (): void => {};
