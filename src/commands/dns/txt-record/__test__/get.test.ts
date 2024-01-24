import { handler } from "../get";

describe("get", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should return dns-txt", async () => {
    const consoleSpy = jest.spyOn(console, "table");
    await handler({ location: "tradetrust.io" });
    // dns-txt
    expect(consoleSpy).toMatchSnapshot();
    // dns-did
    expect(consoleSpy).toMatchSnapshot();
  });
});
