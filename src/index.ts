#!/usr/bin/env node
import yargs from "yargs";

yargs
  .commandDir("commands", { extensions: ["ts", "js"] })
  .demandCommand()
  .strict()
  .help().argv;
