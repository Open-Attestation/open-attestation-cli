import { request } from "./web-request";
import { error } from "signale";
const version = process.env.npm_package_version;
const environment = process.env.NODE_ENV

export const versionCheck = async (): Promise<void> => {
  const lastShown = process.env.oa_update_displayed === "1";
  const development = environment === "development"
  if(development || lastShown) return;
  const latest = await getLatestReleaseVersion();
  if (latest !== version) {
    error(`The latest version of OpenAttestation CLI is ${latest}, you are currently on ${version}`);
    error(
      `Please visit https://github.com/open-attestation/open-attestation-cli/releases or upgrade your package using the npm package manager`
    );
  }
  process.env.oa_update_displayed = "1";
  return;
};

export const getLatestReleaseVersion = async () => {
  const { name: latest } = await request(
    "https://api.github.com/repos/open-attestation/open-attestation-cli/releases/latest"
  );
  return latest;
}