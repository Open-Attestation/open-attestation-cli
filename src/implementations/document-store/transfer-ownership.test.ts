import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import { DocumentStoreTransferOwnershipCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";
import { join } from "path";
import { transferDocumentStoreOwnership } from "./transfer-ownership";

jest.mock("@tradetrust-tt/document-store");

const deployParams: DocumentStoreTransferOwnershipCommand = {
  newOwner: "0xabcd",
  address: "0x1234",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

const deployParamsHederaTestnet: DocumentStoreTransferOwnershipCommand = {
  newOwner: "0xabcd",
  address: "0x1234",
  network: "hederatestnet",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of DocumentStoreFactory
// ideally must setup ganache, and run the function over it
describe("document-store", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("transfer document store owner role to wallet", () => {
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
    const mockedGrantRole = jest.fn();
    const mockedRevokeRole = jest.fn();
    const mockedCallStaticGrantRole = jest.fn().mockResolvedValue(undefined);
    const mockedCallStaticRevokeRole = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedConnect.mockReset();
      mockedCallStaticGrantRole.mockClear();
      mockedCallStaticRevokeRole.mockClear();
      mockedConnect.mockReturnValue({
        grantRole: mockedGrantRole,
        revokeRole: mockedRevokeRole,
        DEFAULT_ADMIN_ROLE: jest.fn().mockResolvedValue("ADMIN"),
        callStatic: {
          grantRole: mockedCallStaticGrantRole,
          revokeRole: mockedCallStaticRevokeRole,
        },
      });
      mockedGrantRole.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
      mockedRevokeRole.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });
    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await transferDocumentStoreOwnership(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedCallStaticGrantRole).toHaveBeenCalledTimes(1);
      expect(mockedGrantRole.mock.calls[0][0]).toEqual("ADMIN");
      expect(mockedGrantRole.mock.calls[0][1]).toEqual(deployParams.newOwner);

      expect(await instance.grantTransaction).toStrictEqual({ transactionHash: "transactionHash" });
      expect(await instance.revokeTransaction).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept account without 0x prefix and return deployed instance", async () => {
      const instance = await transferDocumentStoreOwnership({
        ...deployParams,
        newOwner: addAddressPrefix("abcd"),
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedCallStaticGrantRole).toHaveBeenCalledTimes(1);
      expect(mockedGrantRole.mock.calls[0][0]).toEqual("ADMIN");
      expect(mockedGrantRole.mock.calls[0][1]).toEqual(deployParams.newOwner);

      expect(await instance.grantTransaction).toStrictEqual({ transactionHash: "transactionHash" });
      expect(await instance.revokeTransaction).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      await transferDocumentStoreOwnership({
        newOwner: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });
    it("should take in the key from key file", async () => {
      await transferDocumentStoreOwnership({
        newOwner: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    //Hedera Testnet
    it("should pass in the correct params and return the deployed instance for hederatestnet", async () => {
      const instance = await transferDocumentStoreOwnership(deployParamsHederaTestnet);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParamsHederaTestnet.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.address);
      expect(mockedCallStaticGrantRole).toHaveBeenCalledTimes(1);
      expect(mockedGrantRole.mock.calls[0][0]).toEqual("ADMIN");
      expect(mockedGrantRole.mock.calls[0][1]).toEqual(deployParamsHederaTestnet.newOwner);

      expect(await instance.grantTransaction).toStrictEqual({ transactionHash: "transactionHash" });
      expect(await instance.revokeTransaction).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept account without 0x prefix and return deployed instance for hederatestnet", async () => {
      const instance = await transferDocumentStoreOwnership({
        ...deployParamsHederaTestnet,
        newOwner: addAddressPrefix("abcd"),
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParamsHederaTestnet.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.address);
      expect(mockedCallStaticGrantRole).toHaveBeenCalledTimes(1);
      expect(mockedGrantRole.mock.calls[0][0]).toEqual("ADMIN");
      expect(mockedGrantRole.mock.calls[0][1]).toEqual(deployParamsHederaTestnet.newOwner);

      expect(await instance.grantTransaction).toStrictEqual({ transactionHash: "transactionHash" });
      expect(await instance.revokeTransaction).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should take in the key from environment variable for hederatestnet", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      await transferDocumentStoreOwnership({
        newOwner: "0xabcd",
        address: "0x1234",
        network: "hederatestnet",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });
    it("should take in the key from key file for hederatestnet", async () => {
      await transferDocumentStoreOwnership({
        newOwner: "0xabcd",
        address: "0x1234",
        network: "hederatestnet",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });
  });
});
