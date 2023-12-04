#!/usr/bin/env node
import yargs from "yargs";
import { versionCheck } from "./implementations/utils/github-version";

yargs
  .scriptName("tradetrust")
  .commandDir("commands", { extensions: ["ts", "js"] })
  .middleware([versionCheck])
  .demandCommand()
  .strict()
  .help().argv;
