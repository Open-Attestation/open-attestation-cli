import { deployDocumentStore } from "./document-store";
import { join } from "path";
import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@govtechsg/document-store");

const deployParams: DeployDocumentStoreCommand = {
  storeName: "Test Document Store",
  network: "ropsten",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  gasPriceScale: 1,
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
        network: "ropsten",
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployDocumentStore({
        storeName: "Test",
        network: "ropsten",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployDocumentStore(deployParams);

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedDeploy.mock.calls[0][0]).toStrictEqual(deployParams.storeName);
      // price should be any length string of digits
      expect(mockedDeploy.mock.calls[0][1].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
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
          network: "ropsten",
          gasPriceScale: 1,
          dryRun: false,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });
  });
});
