#!/usr/bin/env node
import yargs from "yargs";

yargs
  .scriptName("open-attestation")
  .commandDir("commands", { extensions: ["ts", "js"] })
  .demandCommand()
  .strict()
  .help().argv;
