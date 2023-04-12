import { encodeInitParams, retrieveFactoryAddress } from "./helpers";
import { isAddress } from "ethers/lib/utils";

describe("valid Token Registry Factory Address", () => {
  it("should return deployer address", () => {
    const address = retrieveFactoryAddress(5, undefined);

    expect(isAddress(address.titleEscrowFactory)).toBe(true);
    expect(isAddress(address.tokenImplementation)).toBe(true);
    expect(isAddress(address.deployer)).toBe(true);
  });

  it("should return provided deployer address", () => {
    const suppliedAddress = {
      titleEscrowFactory: "0xd6C249d0756059E21Ef4Aef4711B69b76927BEA7",
      tokenImplementation: "",
      deployer: "",
    };
    const address = retrieveFactoryAddress(5, suppliedAddress);

    expect(address.titleEscrowFactory).toBe(suppliedAddress.titleEscrowFactory);
    expect(isAddress(address.tokenImplementation)).toBe(true);
    expect(isAddress(address.deployer)).toBe(true);
  });

  it("should reject invalid chainId", () => {
    let validTest = false;
    try {
      retrieveFactoryAddress(2022);
    } catch (e) {
      validTest = true;
    } finally {
      expect(validTest).toBe(true);
    }
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
