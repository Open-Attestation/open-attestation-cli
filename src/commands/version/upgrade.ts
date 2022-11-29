import { Argv } from "yargs";
const version = process.env.npm_package_version;
import { platform } from "os";
import { error, success, info } from "signale";
import fs from "fs";
import { request } from "../dns/txt-record/create";
import fetch, { Response } from "node-fetch";

import util from "util";
import { pipeline } from "stream";
import { progress as defaultProgress } from "../../implementations/utils/progress";

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

const downloadFile = async (
  downloadInfo: GithubDownloadInfo,
  path: string,
  progress: (progress: number) => void
): Promise<void> => {
  const { name: filename, url, size } = downloadInfo;
  const newOAFile = fs.createWriteStream(path + filename);
  const streamPipeline = util.promisify(pipeline);
  const response: Response = await fetch(url);
  if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
  let downloadedSize = 0;
  const totalSize = size;
  response.body.on("data", (data: any) => {
    downloadedSize += data.length;
    progress(downloadedSize / totalSize);
  });
  await streamPipeline(response.body, newOAFile);
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
    let downloadInfo: GithubDownloadInfo | undefined;
    assets.forEach((platformAsset) => {
      if (platformAsset.name.includes(expectedPlatform)) {
        downloadInfo = {
          name: `${latest}-${platformAsset.name}`,
          size: platformAsset.size,
          url: platformAsset.browser_download_url,
        };
      }
    });
    if (!downloadInfo) {
      error("Download link for OpenAttestation CLI is currently unavailable.");
      error("Please visit the releases page for more information.");
      info(`https://github.com/open-attestation/open-attestation-cli/releases`);
    } else {
      const progress = defaultProgress("Downloading");
      await downloadFile(downloadInfo, argv.path, progress);
      success(`OpenAttestation CLI has been successfully downloaded into ${argv.path}${downloadInfo.name}`);
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

interface GithubDownloadInfo {
  name: string;
  url: string;
  size: number;
}
