import { Argv } from "yargs";
const version = process.env.npm_package_version;
import { request } from "../dns/txt-record/create";
import { success, info } from "signale";

export const command = "check [options]";

export const describe = "Check if OpenAttestation CLI is latest version available";

export const builder = (yargs: Argv): Argv => yargs.version();

export const handler = async (): Promise<void> => {
  const { name: latest } = await request(
    "https://api.github.com/repos/open-attestation/open-attestation-cli/releases/latest"
  );
  if (latest !== version) {
    info(`The latest version of OpenAttestation CLI is ${latest}, you are currently on ${version}`);
    info(
      `Please visit https://github.com/open-attestation/open-attestation-cli/releases or upgrade your package using the npm package manager`
    );
    info(
      `You could also download the latest version of OpenAttestation CLI using the open-attestation-cli upgrade command`
    );
  } else {
    success(`The current version of OpenAttestation CLI ${version} is the latest version`);
  }
  return;
};
