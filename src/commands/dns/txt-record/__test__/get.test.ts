import { handler } from "../get";

describe("get", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should return dns-txt", async () => {
    const consoleSpy = jest.spyOn(console, "table");
    await handler({ location: "tradetrust.io" });

    const mockCall1 = consoleSpy.mock.calls[0][0];
    mockCall1.sort((a: any, b: any) => {
      if (a.netId < b.netId) return -1;
      if (a.netId > b.netId) return 1;
      if (a.addr < b.addr) return -1;
      if (a.addr > b.addr) return 1;
      return 0;
    });
    const mockCall2 = consoleSpy.mock.calls[1][0];
    mockCall2.sort((a: any, b: any) => (a.publicKey < b.publicKey ? -1 : 1));
    // dns-txt
    expect(mockCall1).toMatchSnapshot();
    // dns-did
    expect(mockCall2).toMatchSnapshot();
  });
});
