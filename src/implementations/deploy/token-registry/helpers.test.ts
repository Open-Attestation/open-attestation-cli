import { isAddress } from "ethers/lib/utils";
import { encodeInitParams, getDefaultContractAddress } from "./helpers";

describe("valid Token Registry Factory Address", () => {
  it("should return deployer address", () => {
    const { TitleEscrowFactory, TokenImplementation, Deployer } = getDefaultContractAddress(1);

    expect(TitleEscrowFactory).toBeDefined();
    expect(TokenImplementation).toBeDefined();
    expect(Deployer).toBeDefined();

    expect(isAddress(TitleEscrowFactory || "")).toBe(true);
    expect(isAddress(TokenImplementation || "")).toBe(true);
    expect(isAddress(Deployer || "")).toBe(true);
  });
});

describe("valid encodeInit parameters", () => {
  it("should encode parameters correctly", () => {
    const params = encodeInitParams({
      name: "Token Registry Factory",
      symbol: "TCR",
      deployer: "0xd6C249d0756059E21Ef4Aef4711B69b76927BEA7",
    });
    expect(params).toContain(
      "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000d6c249d0756059e21ef4aef4711b69b76927bea70000000000000000000000000000000000000000000000000000000000000016546f6b656e20526567697374727920466163"
    );
  });
});
