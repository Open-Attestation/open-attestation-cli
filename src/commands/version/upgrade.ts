// yargs.version

import { Argv } from "yargs";
import { getLogger } from "../../logger";
const { trace } = getLogger("version:update");
const version = process.env.npm_package_version;
import https from "https";
import { platform } from "os";
import signale, { error, success, info } from "signale";
import fs from "fs";
import { request } from "../dns/txt-record/create";
import { ClientRequest } from "http";

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

const downloadFile = async (url: string, path: string, filename: string): Promise<ClientRequest> => {
  const file = fs.createWriteStream(path + filename);
  const request = https.get(url, function (response) {
    response.pipe(file);

    // after download completed close filestream
    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
    });
  });
  return request;
};

type supportedPlatforms = "linux" | "win" | "macos";

export interface OpenAttestationDownloadArgs {
  path: string;
}

export const handler = async (argv: OpenAttestationDownloadArgs): Promise<void> => {
  const response: GithubReleaseSchema = await request(
    "https://api.github.com/repos/open-attestation/open-attestation-cli/releases/latest"
  );
  const latest = response.name;
  const assets = response.assets;
  if (latest !== version) {
    const machinePlatform = platform();
    let expectedPlatform: supportedPlatforms = "linux";
    switch (machinePlatform) {
      case "darwin":
        expectedPlatform = "macos";
        break;
      case "win32":
        expectedPlatform = "win";
        break;
      case "linux":
        expectedPlatform = "linux";
        break;
      default:
        error("The platform detected is currently unsupported.");
        error("Will assume that the platform is linux-compatible.");
        break;
    }
    info(`The latest version of OpenAttestation CLI is ${latest}, you are currently on ${version}`);
    info(`Downloading OpenAttestation CLI...`);
    let downloadURL: string;
    let downloadName: string;

    assets.forEach((platformAsset) => {
      if (platformAsset.name.includes(expectedPlatform)) {
        downloadURL = platformAsset.browser_download_url;
        downloadName = platformAsset.name;
      }
    });
    if (!downloadURL! || !downloadName!) {
      error("Download link for OpenAttestation CLI is currently unavailable.");
      error("Please visit the releases page for more information.");
      info(`https://github.com/open-attestation/open-attestation-cli/releases`);
    } else {
      await downloadFile(downloadURL, argv.path, downloadName);
      success(`OpenAttestation CLI have been successfully downloaded into ${argv.path}`);
    }
  } else {
    success(`You do not need an upgrade of OpenAttestation CLI.`);
  }
};

interface GithubReleaseSchema {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string; // DateTime
  published_at: string; // DateTime
  tarball_url: string;
  zipball_url: string;
  body: string;
  assets: [GithubAssetsSchema];
}

interface GithubAssetsSchema {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: string;
  content_type: string;
  state: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}
