import { Argv } from "yargs";

export const command = "gsn-capable <method>";

export const describe = "Invoke a function over a gsn capable smart contract on the blockchain";

export const builder = (yargs: Argv): Argv => yargs.commandDir("gsn-capable", { extensions: ["ts", "js"] });

export const handler = (): void => {};
