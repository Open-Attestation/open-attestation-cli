import { Argv } from "yargs";
import * as ethers from "ethers";
ethers.errors.setLogLevel("error"); // disable warning from ethers

export const command = "deploy <contract-type>";

export const describe = "Deploys a smart contract on the blockchain";

export const builder = (yargs: Argv): Argv => yargs.commandDir("deploy", { extensions: ["ts", "js"] });

export const handler = (): void => {};
