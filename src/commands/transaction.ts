import { Argv } from "yargs";

export const command = "transaction <method>";

export const describe = "Invoke a function over a transaction on the blockchain ";

export const builder = (yargs: Argv): Argv => yargs.commandDir("transaction", { extensions: ["ts", "js"] });

export const handler = (): void => {};
