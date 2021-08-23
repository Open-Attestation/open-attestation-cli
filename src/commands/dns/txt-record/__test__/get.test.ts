import { handler } from "../get";

describe("get", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should return dns-txt", async () => {
    const consoleSpy = jest.spyOn(console, "table");
    await handler({ location: "donotuse.openattestation.com" });
    // dns-txt
    expect(consoleSpy).toHaveBeenNthCalledWith(1, [
      {
        addr: "0x2f60375e8144e16Adf1979936301D8341D58C36C",
        dnssec: true,
        net: "ethereum",
        netId: "3",
        type: "openatts",
      },
    ]);
    // dns-did
    expect(consoleSpy).toHaveBeenNthCalledWith(2, [
      {
        algorithm: "dns-did",
        dnssec: true,
        publicKey: "did:ethr:0xE712878f6E8d5d4F9e87E10DA604F9cB564C9a89#controller",
        type: "openatts",
        version: "1.0",
      },
    ]);
  });
});
