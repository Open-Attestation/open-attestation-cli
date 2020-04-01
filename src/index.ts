#!/usr/bin/env node
import yargs from "yargs";

yargs
  .commandDir("commands", { extensions: ["ts"] })
  .demandCommand()
  .strict()
  .version(false)
  .help().argv;
