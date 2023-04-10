import { readFromOAConfig, writeToOAConfig } from "./cli-config";
import { request } from "./web-request";
import { warn } from "signale";
const version = process.env.npm_package_version;
const environment = process.env.NODE_ENV;
const checksFrequency = 1 * 24 * 60 * 60; // 1 day, 24 hour, 60 minutes, 60 seconds

export const versionCheck = async (): Promise<void> => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const { nextUpdateMessageDisplayTimestamp } = readFromOAConfig();
  const development = environment === "development";
  if(currentTimestamp < nextUpdateMessageDisplayTimestamp || development) return;

  const latest = await getLatestReleaseVersion();
  if (latest !== version) {
    warn(`The latest version of OpenAttestation CLI is ${latest}, you are currently on ${version}`);
  }
  writeToOAConfig({'nextUpdateMessageDisplayTimestamp': currentTimestamp + checksFrequency})
  return;
};

export const getLatestReleaseVersion = async (): Promise<string> => {
  const { name: latest } = await request(
    "https://api.github.com/repos/open-attestation/open-attestation-cli/releases/latest"
  );
  return latest;
};
