import { Argv } from "yargs";

export const command = "deploy <contract-type>";

export const describe = "Deploys a smart contract on the blockchain";

export const builder = (yargs: Argv): Argv => yargs.commandDir("deploy", { extensions: ["ts", "js"] });

export const handler = (): void => {};
