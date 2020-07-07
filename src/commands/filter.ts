import { Argv } from "yargs";
import { filter } from "../implementations/filter";

interface FilterCommand {
  source: string;
  destination: string;
  fields: string[];
}

export const command = "filter <source> <destination> [fields..]";

export const describe = "Obfuscate fields in the document";

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional("source", {
      description: "Source wrapped document filename",
      normalize: true,
    })
    .positional("destination", {
      description: "Destination to write obfuscated document file to",
      normalize: true,
    });

export const handler = (args: FilterCommand): void => {
  return filter(args.source, args.destination, args.fields);
};
