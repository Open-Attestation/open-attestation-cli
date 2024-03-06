import { deployDocumentStore } from "./document-store";
import { join } from "path";
import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@tradetrust-tt/document-store");

const deployParams: DeployDocumentStoreCommand = {
  storeName: "Test Document Store",
  owner: "0x1234",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

const deployParamsHederaTestnet: DeployDocumentStoreCommand = {
  storeName: "Test Document Store",
  owner: "0x1234",
  network: "hederatestnet",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("document-store", () => {
  describe("deployDocumentStore", () => {
    const documentStoreFactory: any = DocumentStoreFactory;
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = documentStoreFactory;
    const mockedDeploy: jest.Mock = mockedDocumentStoreFactory.prototype.deploy;
    // increase timeout because ethers is throttling
    jest.setTimeout(30000);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedDeploy.mockReset();
      mockedDeploy.mockResolvedValue({
        deployTransaction: { hash: "hash", wait: () => Promise.resolve({ contractAddress: "contractAddress" }) },
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployDocumentStore({
        storeName: "Test",
        network: "sepolia",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployDocumentStore({
        storeName: "Test",
        network: "sepolia",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployDocumentStore(deployParams);

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedDeploy.mock.calls[0][0]).toStrictEqual(deployParams.storeName);
      expect(mockedDeploy.mock.calls[0][1]).toStrictEqual(deployParams.owner);
      // price should be any length string of digits
      expect(mockedDeploy.mock.calls[0][2].maxPriorityFeePerGas.toString()).toStrictEqual(expect.stringMatching(/\d+/));
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployDocumentStore(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        deployDocumentStore({
          storeName: "Test",
          network: "sepolia",
          dryRun: false,
          maxPriorityFeePerGasScale: 1,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    it("should default the owner as the deployer", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployDocumentStore({
        maxPriorityFeePerGasScale: 1,
        storeName: "Test",
        network: "sepolia",
        dryRun: false,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      const addr = await passedSigner.getAddress();
      expect(mockedDeploy.mock.calls[0][1]).toStrictEqual(addr);
    });

    //Hedera Testnet
    it("should take in the key from environment variable for hederatestnet", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployDocumentStore({
        storeName: "Test",
        network: "hederatestnet",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file for hederatestnet", async () => {
      await deployDocumentStore({
        storeName: "Test",
        network: "hederatestnet",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance for hederatestnet", async () => {
      const instance = await deployDocumentStore(deployParamsHederaTestnet);

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParamsHederaTestnet.key}`);
      expect(mockedDeploy.mock.calls[0][0]).toStrictEqual(deployParamsHederaTestnet.storeName);
      expect(mockedDeploy.mock.calls[0][1]).toStrictEqual(deployParamsHederaTestnet.owner);
      // price should be any length string of digits
      expect(mockedDeploy.mock.calls[0][2].maxPriorityFeePerGas.toString()).toStrictEqual(expect.stringMatching(/\d+/));
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up for hederatestnet", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployDocumentStore(deployParamsHederaTestnet)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere for hederatestnet", async () => {
      await expect(
          deployDocumentStore({
            storeName: "Test",
            network: "hederatestnet",
            dryRun: false,
            maxPriorityFeePerGasScale: 1,
          })
      ).rejects.toThrow(
          "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    it("should default the owner as the deployer for hederatestnet", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployDocumentStore({
        maxPriorityFeePerGasScale: 1,
        storeName: "Test",
        network: "hederatestnet",
        dryRun: false,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      const addr = await passedSigner.getAddress();
      expect(mockedDeploy.mock.calls[0][1]).toStrictEqual(addr);
    });
  });
});
