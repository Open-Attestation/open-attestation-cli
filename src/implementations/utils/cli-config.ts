import { homedir } from "os";
import fs from "fs";

const fileDirectory = homedir + "/.config/tradetrust/";
const fileName = "oacli-config.json";
const configFilePath = fileDirectory + fileName;

export type CliConfigType = {
  nextUpdateMessageDisplayTimestamp: number;
};

export const CLI_CONFIG_DEFAULTS = {
  nextUpdateMessageDisplayTimestamp: 0,
};

const createConfigDirectory = (): void => {
  if (!fs.existsSync(fileDirectory)) {
    fs.mkdirSync(fileDirectory, { recursive: true });
  }
};

export const writeToOAConfig = (configUpdates: Partial<CliConfigType>): void => {
  const configFile = readFromOAConfig();
  const updatedConfig = { ...CLI_CONFIG_DEFAULTS, ...configFile, ...configUpdates };
  const configString = JSON.stringify(updatedConfig);
  createConfigDirectory();
  fs.writeFileSync(configFilePath, configString);
};

export const readFromOAConfig = (): CliConfigType => {
  if (!fs.existsSync(configFilePath) || !fs.existsSync(fileDirectory)) return CLI_CONFIG_DEFAULTS;
  const rawdata = fs.readFileSync(configFilePath);
  const configString = rawdata.toString();
  const parsedConfig = JSON.parse(configString);
  return parsedConfig;
};
