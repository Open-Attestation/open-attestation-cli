import { Argv } from "yargs";
import * as ethers from "ethers";
ethers.errors.setLogLevel("error"); // disable warning from ethers

export const command = "txt-record <method>";

export const describe = "Methods to manipulate Issuer DNS-TXT records";

export const builder = (yargs: Argv): Argv => yargs.commandDir("txt-record", { extensions: ["ts", "js"] });

export const handler = (): void => {};
