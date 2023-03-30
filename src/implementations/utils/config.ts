import { homedir } from "os";
import fs from "fs";
const configFilePath = homedir + "/.oacli-config.json";

export type CliConfigType = {
  updateMessage: number;
};

export const writeToConfig = (): void => {
  const student = JSON.parse(rawdata);
  console.log(student);
};

export const readFromConfig = (): CliConfigType => {
  const rawdata = fs.readFileSync(configFilePath);
  const configString = rawdata.toString();
  const parsedConfig = JSON.parse(configString);
  return parsedConfig;
};
