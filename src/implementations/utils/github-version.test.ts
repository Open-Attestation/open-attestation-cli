import { getLatestReleaseVersion } from "./github-version";

describe("version Check", () => {
  it("should be able to get the latest release", async () => {
    const latest = await getLatestReleaseVersion();
    expect(latest).toBeDefined();
  });
});

// describe("upgrade Check", () => {
//   describe("release Check", () => {
//     const assets: GithubAssetsSchema[] = [
//       {
//         url: "https://api.github.com/repos/Open-Attestation/open-attestation-cli/releases/assets/85781296",
//         id: 85781296,
//         node_id: "RA_kwDODWN8884FHOsw",
//         name: "open-attestation-linux",
//         label: "open-attestation-linux",
//         content_type: "text/plain",
//         state: "uploaded",
//         size: 132572636,
//         download_count: 1,
//         created_at: "2022-11-24T05:36:44Z",
//         updated_at: "2022-11-24T05:36:47Z",
//         browser_download_url:
//           "https://github.com/Open-Attestation/open-attestation-cli/releases/download/v1.55.0/open-attestation-linux",
//       },
//       {
//         url: "https://api.github.com/repos/Open-Attestation/open-attestation-cli/releases/assets/85781291",
//         id: 85781291,
//         node_id: "RA_kwDODWN8884FHOsr",
//         name: "open-attestation-macos",
//         label: "open-attestation-macos",
//         content_type: "text/plain",
//         state: "uploaded",
//         size: 131584396,
//         download_count: 20,
//         created_at: "2022-11-24T05:36:41Z",
//         updated_at: "2022-11-24T05:36:44Z",
//         browser_download_url:
//           "https://github.com/Open-Attestation/open-attestation-cli/releases/download/v1.55.0/open-attestation-macos",
//       },
//       {
//         url: "https://api.github.com/repos/Open-Attestation/open-attestation-cli/releases/assets/85781267",
//         id: 85781267,
//         node_id: "RA_kwDODWN8884FHOsT",
//         name: "open-attestation-win.exe",
//         label: "open-attestation-win.exe",
//         content_type: "application/octet-stream",
//         state: "uploaded",
//         size: 126269418,
//         download_count: 0,
//         created_at: "2022-11-24T05:36:38Z",
//         updated_at: "2022-11-24T05:36:40Z",
//         browser_download_url:
//           "https://github.com/Open-Attestation/open-attestation-cli/releases/download/v1.55.0/open-attestation-win.exe",
//       },
//     ];

    // it("should be able to get the latest release assets - windows", async () => {
    //   const release = await getReleaseAsset("win32", assets, "jest-test-win32");
    //   expect(release).toBeDefined();
    //   if (!release) return;
    //   expect(release.name).toContain("jest-test-win32-open-attestation-win.exe");
    //   expect(release.size).toBe(126269418);
    //   expect(release.url).toBe(
    //     "https://github.com/Open-Attestation/open-attestation-cli/releases/download/v1.55.0/open-attestation-win.exe"
    //   );
    // });

    // it("should be able to get the latest release assets - linux", async () => {
    //   const release = await getReleaseAsset("linux", assets, "jest-test-linux");
    //   expect(release).toBeDefined();
    //   if (!release) return;
    //   expect(release.name).toContain("jest-test-linux-open-attestation-linux");
    //   expect(release.size).toBe(132572636);
    //   expect(release.url).toBe(
    //     "https://github.com/Open-Attestation/open-attestation-cli/releases/download/v1.55.0/open-attestation-linux"
    //   );
    // });

    // it("should be able to get the latest release assets - mac", async () => {
    //   const release = await getReleaseAsset("darwin", assets, "jest-test-darwin");
    //   expect(release).toBeDefined();
    //   if (!release) return;
    //   expect(release.name).toBe("jest-test-darwin-open-attestation-macos");
    //   expect(release.size).toBe(131584396);
    //   expect(release.url).toBe(
    //     "https://github.com/Open-Attestation/open-attestation-cli/releases/download/v1.55.0/open-attestation-macos"
    //   );
    // });
//   });
// });
