import { request } from "../dns/txt-record/create";

import fs from "fs";
import fetch, { Response } from "node-fetch";
import util from "util";
import { pipeline } from "stream";

import { progress as defaultProgress } from "../../implementations/utils/progress";
import { error } from "signale";

const ReleaseAPI = "https://api.github.com/repos/open-attestation/open-attestation-cli/releases/latest";

export const getLatestRelease = async (): Promise<GithubReleaseSchema> => {
    return await request(
        ReleaseAPI
    );
}

export const getReleaseAsset = async (machinePlatform: string, availableAssets: GithubAssetsSchema[], latest: string): Promise<GithubDownloadInfo | undefined> => {
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
    let downloadInfo: GithubDownloadInfo | undefined;
    availableAssets.forEach((platformAsset) => {
      if (platformAsset.name.includes(expectedPlatform)) {
        downloadInfo = {
          name: `${latest}-${platformAsset.name}`,
          size: platformAsset.size,
          url: platformAsset.browser_download_url,
        };
      }
    });
    return downloadInfo;
}


export const downloadFile = async (
    downloadInfo: GithubDownloadInfo,
    path: string,
  ): Promise<void> => {
    const progress = defaultProgress("Downloading");
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

export type supportedPlatforms = "linux" | "win" | "macos";

export interface GithubReleaseSchema {
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
    assets: GithubAssetsSchema[];
  }
  
  export interface GithubAssetsSchema {
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
  
  export interface GithubDownloadInfo {
    name: string;
    url: string;
    size: number;
  }