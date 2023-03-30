import { request } from "./web-request";
import { warn } from "signale";
const version = process.env.npm_package_version;
const environment = process.env.NODE_ENV;

export const versionCheck = async (): Promise<void> => {
  const messageShown = process.env.oa_update_displayed === "1";
  const development = environment === "development";
  if (development || messageShown) return;
  const latest = await getLatestReleaseVersion();
  if (latest !== version) {
    warn(`The latest version of OpenAttestation CLI is ${latest}, you are currently on ${version}`);
  }
  process.env.oa_update_displayed = "1";
  return;
};

export const getLatestReleaseVersion = async (): Promise<string> => {
  const { name: latest } = await request(
    "https://api.github.com/repos/open-attestation/open-attestation-cli/releases/latest"
  );
  return latest;
};
