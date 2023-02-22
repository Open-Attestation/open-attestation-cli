import { Argv } from "yargs";
const version = process.env.npm_package_version;
import { platform } from "os";
import { error, success, info } from "signale";

import {
  downloadFile,
  getLatestRelease,
  getReleaseAsset,
  GithubDownloadInfo,
} from "../../implementations/utils/github-version";

export const command = "upgrade [options]";

export const describe = "Upgrade OpenAttestation CLI";

export const builder = (yargs: Argv): Argv =>
  yargs.option("path", {
    alias: "location",
    description: "Destination directory to OpenAttestation CLI executable",
    type: "string",
    default: "./",
    demandOption: false,
  });

export interface OpenAttestationDownloadArgs {
  path: string;
}

export const handler = async (argv: OpenAttestationDownloadArgs): Promise<void> => {
  const { assets, name: latest } = await getLatestRelease();
  if (latest !== version) {
    const machinePlatform = platform();
    info(`The latest version of OpenAttestation CLI is ${latest}, you are currently on ${version}`);
    info(`Downloading OpenAttestation CLI...`);
    const downloadInfo: GithubDownloadInfo | undefined = await getReleaseAsset(machinePlatform, assets, latest);
    if (!downloadInfo) {
      error("Download link for OpenAttestation CLI is currently unavailable.");
      error("Please visit the releases page for more information.");
      info(`https://github.com/open-attestation/open-attestation-cli/releases`);
    } else {
      await downloadFile(downloadInfo, argv.path);
      success(`OpenAttestation CLI has been successfully downloaded into ${argv.path}${downloadInfo.name}`);
    }
  } else {
    success(`You do not need an upgrade of OpenAttestation CLI.`);
  }
};
