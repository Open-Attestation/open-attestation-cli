import { Argv } from "yargs";

export const command = "version <method>";

export const describe = "Updating and Upgrading OpenAttestation CLI";

export const builder = (yargs: Argv): Argv => yargs.commandDir("version", { extensions: ["ts", "js"] });

export const handler = (): void => {};
