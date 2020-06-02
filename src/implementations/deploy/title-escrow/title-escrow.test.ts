import { deployTitleEscrow } from "./title-escrow";
import { join } from "path";
import { TitleEscrowFactory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { DeployTitleEscrowCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@govtechsg/token-registry");

const deployParams: DeployTitleEscrowCommand = {
  tokenRegistryAddress: "0x0000000000000000000000000000000000000000",
  beneficiary: "0x0000000000000000000000000000000000000001",
  holder: "0x0000000000000000000000000000000000000002",
  titleEscrowFactoryAddress: "0x0000000000000000000000000000000000000003",
  network: "ropsten",
  key: "0000000000000000000000000000000000000000000000000000000000000001"
};

describe("token-registry", () => {
  describe("deployTitleEscrow", () => {
    const tokenFactory: any = TitleEscrowFactory;
    const mockedTokenFactory: jest.Mock<TitleEscrowFactory> = tokenFactory;
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

      await deployTitleEscrow({
        tokenRegistryAddress: "0x0000000000000000000000000000000000000000",
        beneficiary: "0x0000000000000000000000000000000000000001",
        holder: "0x0000000000000000000000000000000000000002",
        titleEscrowFactoryAddress: "0x0000000000000000000000000000000000000003",
        network: "ropsten"
      });

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployTitleEscrow({
        network: "ropsten",
        tokenRegistryAddress: "0x0000000000000000000000000000000000000000",
        beneficiary: "0x0000000000000000000000000000000000000001",
        holder: "0x0000000000000000000000000000000000000002",
        titleEscrowFactoryAddress: "0x0000000000000000000000000000000000000003",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key")
      });

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployTitleEscrow(deployParams);

      const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedDeploy.mock.calls[0]).toEqual([
         "0x0000000000000000000000000000000000000000",
         "0x0000000000000000000000000000000000000001",
         "0x0000000000000000000000000000000000000002",
         "0x0000000000000000000000000000000000000003" 
      ]);
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployTitleEscrow(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      delete process.env.OA_PRIVATE_KEY;
      await expect(
        deployTitleEscrow({
          network: "ropsten",
          tokenRegistryAddress: "0x0000000000000000000000000000000000000000",
          beneficiary: "0x0000000000000000000000000000000000000001",
          holder: "0x0000000000000000000000000000000000000002",
          titleEscrowFactoryAddress: "0x0000000000000000000000000000000000000003"
        })
      ).rejects.toThrow("No private key found in OA_PRIVATE_KEY, key or key-file, please supply at least one");
    });
  });
});
