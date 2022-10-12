import { transferDocumentStoreOwnershipToWallet } from "./transfer-ownership";
import { join } from "path";
import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { DocumentStoreTransferOwnershipCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";

jest.mock("@govtechsg/document-store");

const deployParams: DocumentStoreTransferOwnershipCommand = {
  newOwner: "0xabcd",
  address: "0x1234",
  network: "goerli",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of DocumentStoreFactory
// ideally must setup ganache, and run the function over it
describe("document-store", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("transferDocumentStoreOwnershipToWallet", () => {
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
    const mockedTransfer = jest.fn();
    const mockCallStaticTransferOwnership = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedConnect.mockReset();
      mockCallStaticTransferOwnership.mockClear();
      mockedConnect.mockReturnValue({
        transferOwnership: mockedTransfer,
        callStatic: {
          transferOwnership: mockCallStaticTransferOwnership,
        },
      });
      mockedTransfer.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await transferDocumentStoreOwnershipToWallet({
        newOwner: "0xabcd",
        address: "0x1234",
        network: "goerli",
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await transferDocumentStoreOwnershipToWallet({
        newOwner: "0xabcd",
        address: "0x1234",
        network: "goerli",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await transferDocumentStoreOwnershipToWallet(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticTransferOwnership).toHaveBeenCalledTimes(1);
      expect(mockedTransfer.mock.calls[0][0]).toEqual(deployParams.newOwner);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept newOwner without 0x prefix and return deployed instance", async () => {
      const instance = await transferDocumentStoreOwnershipToWallet({
        ...deployParams,
        newOwner: addAddressPrefix("abcd"),
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticTransferOwnership).toHaveBeenCalledTimes(1);
      expect(mockedTransfer.mock.calls[0][0]).toEqual(deployParams.newOwner);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should allow errors to bubble up", async () => {
      mockedConnect.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(transferDocumentStoreOwnershipToWallet(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        transferDocumentStoreOwnershipToWallet({
          newOwner: "0xabcd",
          address: "0x1234",
          network: "goerli",
          gasPriceScale: 1,
          dryRun: false,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });
  });
});
