import { deployTitleEscrowCreator } from "./title-escrow-creator";
import { join } from "path";
import { TitleEscrowCreatorFactory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { DeployTitleEscrowCreatorCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@govtechsg/token-registry");

const deployParams: DeployTitleEscrowCreatorCommand = {
  network: "ropsten",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  gasPriceScale: 1
};

describe("token-registry", () => {
  describe("deployTitleEscrowCreator", () => {
    const tokenFactory: any = TitleEscrowCreatorFactory;
    const mockedTokenFactory: jest.Mock<TitleEscrowCreatorFactory> = tokenFactory;
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

      await deployTitleEscrowCreator({
        network: "ropsten",
        gasPriceScale: 1
      });

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployTitleEscrowCreator({
        network: "ropsten",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
        gasPriceScale: 1
      });

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployTitleEscrowCreator(deployParams);

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedDeploy.mock.calls[0][0].gasPrice.toString()).toStrictEqual("1000000000");
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployTitleEscrowCreator(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      delete process.env.OA_PRIVATE_KEY;
      await expect(
        deployTitleEscrowCreator({
          network: "ropsten",
          gasPriceScale: 1
        })
      ).rejects.toThrow("No private key found in OA_PRIVATE_KEY, key or key-file, please supply at least one");
    });
  });
});
