import { Argv } from "yargs";

export const command = "paymaster <method>";

export const describe = "Invoke a function over a paymaster smart contract on the blockchain";

export const builder = (yargs: Argv): Argv => yargs.commandDir("paymaster", { extensions: ["ts", "js"] });

export const handler = (): void => {};
