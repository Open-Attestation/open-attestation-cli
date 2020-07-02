import { Argv } from "yargs";
import * as ethers from "ethers";
ethers.errors.setLogLevel("error"); // disable warning from ethers

export const command = "wallet <method>";

export const describe = "Manage Ethereum Wallet";

export const builder = (yargs: Argv): Argv => yargs.commandDir("wallet", { extensions: ["ts", "js"] });

export const handler = (): void => {};
