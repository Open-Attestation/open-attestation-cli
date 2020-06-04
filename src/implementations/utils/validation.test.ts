import { validateAddress } from "./validation";

describe("validateAddress", () => {
  it("should throw when value is not an address", () => {
    expect(() => validateAddress("")).toThrow(/not a valid Ethereum address/);
    expect(() => validateAddress("foobar")).toThrow(/not a valid Ethereum address/);
    expect(() => validateAddress("0x37531Cfb40F82dC223dD7C93957d384729DB8184")).toThrow(/not a valid Ethereum address/);
  });

  it("should pass when value is an address", () => {
    expect(() => validateAddress("37531Cfb40F82dC223dD7C93957d384729DB8183")).not.toThrow(
      /not a valid Ethereum address/
    );
    expect(() => validateAddress("0x37531Cfb40F82dC223dD7C93957d384729DB8183")).not.toThrow(
      /not a valid Ethereum address/
    );
  });
});
