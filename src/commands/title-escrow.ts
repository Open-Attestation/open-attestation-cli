import { Argv } from "yargs";

export const command = "title-escrow <method>";

export const describe = "Invoke a function over a title escrow smart contract on the blockchain";

export const builder = (yargs: Argv): Argv => yargs.commandDir("title-escrow", { extensions: ["ts", "js"] });

export const handler = (): void => {};
