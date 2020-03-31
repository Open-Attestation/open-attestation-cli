import yargs from "yargs";

yargs
  .commandDir("commands", { extensions: ["ts"] })
  .demandCommand()
  .strict()
  .help().argv;
