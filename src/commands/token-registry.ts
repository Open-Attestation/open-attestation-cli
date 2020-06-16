import { Argv } from "yargs";
import * as ethers from "ethers";
ethers.errors.setLogLevel("error"); // disable warning from ethers

export const command = "token-registry <method>";

export const describe = "Invoke a function over a token registry smart contract on the blockchain";

export const builder = (yargs: Argv): Argv => yargs.commandDir("token-registry", { extensions: ["ts", "js"] });

export const handler = (): void => {};
