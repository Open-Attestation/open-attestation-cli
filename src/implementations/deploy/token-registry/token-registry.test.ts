import { deployTokenRegistry } from "./token-registry";
import { join } from "path";
import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@govtechsg/token-registry");

const deployParams: DeployTokenRegistryCommand = {
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
      mockedDeploy.mockResolvedValue({
        deployTransaction: { hash: "hash", wait: () => Promise.resolve({ contractAddress: "contractAddress" }) }
      });
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
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key")
      });

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployTokenRegistry(deployParams);

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedDeploy.mock.calls[0]).toEqual([deployParams.registryName, deployParams.registrySymbol]);
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployTokenRegistry(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      delete process.env.OA_PRIVATE_KEY;
      await expect(
        deployTokenRegistry({
          registryName: "Test",
          registrySymbol: "Tst",
          network: "ropsten"
        })
      ).rejects.toThrow("No private key found in OA_PRIVATE_KEY, key or key-file, please supply at least one");
    });
  });
});
