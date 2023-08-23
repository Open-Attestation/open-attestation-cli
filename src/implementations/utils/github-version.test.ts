import { getLatestReleaseVersion } from "./github-version";

describe("version Check", () => {
  it("should be able to get the latest release", async () => {
    const latest = await getLatestReleaseVersion();
    expect(latest).toBeDefined();
  });
});
