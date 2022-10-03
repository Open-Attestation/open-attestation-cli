import { Argv } from "yargs";

export const command = "role <method>";

export const describe = "Manages User Roles of Token Registry";

export const builder = (yargs: Argv): Argv => yargs.commandDir("role", { extensions: ["ts", "js"] });

export const handler = (): void => {};
