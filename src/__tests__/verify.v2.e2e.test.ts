import { handler } from "../commands/verify";
import path from "path";
import signale from "signale";

describe("verify", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const signaleSuccessSpy = jest.spyOn(signale, "success");
  const signaleErrorSpy = jest.spyOn(signale, "error");
  it("should work on did.json", async () => {
    await handler({
      document: path.resolve("examples", "v2", "signed-documents", "did.json"),
      verbose: true,
      network: "ropsten",
    });
    expect(signaleSuccessSpy).toHaveBeenCalledTimes(4);
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(1, "The document is valid");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(2, "The document has not been tampered");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(3, "The document has been issued");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(4, "The issuer identity has been verified");
  });
  it("should work on dnsDid.json", async () => {
    await handler({
      document: path.resolve("examples", "v2", "signed-documents", "dnsDid.json"),
      verbose: true,
      network: "ropsten",
    });
    expect(signaleSuccessSpy).toHaveBeenCalledTimes(4);
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(1, "The document is valid");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(2, "The document has not been tampered");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(3, "The document has been issued");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(4, "The issuer identity has been verified");
  });

  it("should not work on did-invalid.json", async () => {
    await handler({
      document: path.resolve("examples", "v2", "signed-documents", "did-invalid.json"),
      verbose: true,
      network: "ropsten",
    });
    expect(signaleErrorSpy).toHaveBeenCalledTimes(4);
    expect(signaleErrorSpy).toHaveBeenNthCalledWith(1, "The document is not valid");
    expect(signaleErrorSpy).toHaveBeenNthCalledWith(2, "The document has been tampered");
    expect(signaleErrorSpy).toHaveBeenNthCalledWith(3, "The document has not been issued");
    expect(signaleErrorSpy).toHaveBeenNthCalledWith(4, "The issuer identity has not been verified");
  });
});
