import { transferDocumentStoreOwnershipToWallet } from "./transfer-ownership";

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
  maxFeePerGasScale: 1,
  maxPriorityFeePerGasScale: 1,
  feeData: false,
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
  });
});
