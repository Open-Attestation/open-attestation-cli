import { deployTokenRegistry } from "./token-registry";
import { join } from "path";
import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";

jest.mock("@govtechsg/token-registry");

const deployParams = {
  registryName: "Test",
  registrySymbol: "Tst",
  network: "ropsten",
  key: "0000000000000000000000000000000000000000000000000000000000000001"
};

describe("token-registry", () => {
  describe("deployTokenRegistry", () => {
    const tokenFactory: any = TradeTrustERC721Factory;
    const mockedTokenFactory: jest.Mock<TradeTrustERC721Factory> = tokenFactory;
    const mockedDeploy: jest.Mock = mockedTokenFactory.prototype.deploy;

    // eslint-disable-next-line jest/no-hooks
    beforeEach(() => {
      mockedTokenFactory.mockReset();
      mockedDeploy.mockReset();
      mockedDeploy.mockResolvedValue("DEPLOYED_INSTANCE");
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployTokenRegistry({
        registryName: "Test",
        registrySymbol: "Tst",
        network: "ropsten"
      });

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployTokenRegistry({
        registryName: "Test",
        registrySymbol: "Tst",
        network: "ropsten",
        keyFile: join(__dirname, "../../../../examples/sample-key")
      });

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in a signer with the private key", async () => {
      await deployTokenRegistry(deployParams);

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
    });

    it("should pass in the name and symbol param", async () => {
      await deployTokenRegistry(deployParams);
      expect(mockedDeploy.mock.calls[0]).toEqual([deployParams.registryName, deployParams.registrySymbol]);
    });

    it("should return the token instance", async () => {
      const instance = await deployTokenRegistry(deployParams);
      expect(instance).toBe("DEPLOYED_INSTANCE");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployTokenRegistry(deployParams)).rejects.toThrow("An Error");
    });
  });
});
