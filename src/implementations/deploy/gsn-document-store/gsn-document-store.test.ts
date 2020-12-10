import { deployGsnDocumentStore } from "./gsn-document-store";
import { join } from "path";
import { Wallet } from "ethers";
import { GsnCapableDocumentStoreFactory } from "@govtechsg/document-store";
import { DeployGsnDocumentStoreCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@govtechsg/document-store");

const deployParams: DeployGsnDocumentStoreCommand = {
  storeName: "Test Document Store",
  trustForwarderAddress: "0x1234",
  network: "ropsten",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  gasPriceScale: 1,
  dryRun: false,
};

describe("gsn-document-store", () => {
  describe("deployGsnDocumentStore", () => {
    const documentStoreFactory: any = GsnCapableDocumentStoreFactory;
    const mockedDocumentStoreFactory: jest.Mock<GsnCapableDocumentStoreFactory> = documentStoreFactory;
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

      await deployGsnDocumentStore({
        storeName: "Test",
        trustForwarderAddress: "0x1234",
        network: "ropsten",
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployGsnDocumentStore({
        storeName: "Test",
        trustForwarderAddress: "0x1234",
        network: "ropsten",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployGsnDocumentStore(deployParams);

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedDeploy.mock.calls[0][0]).toStrictEqual(deployParams.storeName);
      expect(mockedDeploy.mock.calls[0][1]).toStrictEqual(deployParams.trustForwarderAddress);
      // price should be any length string of digits
      expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployGsnDocumentStore(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        deployGsnDocumentStore({
          storeName: "Test",
          trustForwarderAddress: "0x1234",
          network: "ropsten",
          gasPriceScale: 1,
          dryRun: false,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
