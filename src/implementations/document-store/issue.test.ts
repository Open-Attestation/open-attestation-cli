import { issueToDocumentStore } from "./issue";
import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { DocumentStoreIssueCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";

jest.mock("@govtechsg/document-store");

const deployParams: DocumentStoreIssueCommand = {
  hash: "0xabcd",
  address: "0x1234",
  network: "goerli",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of DocumentStoreFactory
// ideally must setup ganache, and run the function over it
describe("document-store", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("issueDocumentStore", () => {
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
    const mockedIssue = jest.fn();
    const mockCallStaticIssue = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedConnect.mockReset();
      mockCallStaticIssue.mockClear();
      mockedConnect.mockReturnValue({
        issue: mockedIssue,
        callStatic: {
          issue: mockCallStaticIssue,
        },
      });
      mockedIssue.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await issueToDocumentStore({
        hash: "0xabcd",
        address: "0x1234",
        network: "goerli",
        maxPriorityFeePerGasScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await issueToDocumentStore(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticIssue).toHaveBeenCalledTimes(1);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept hash without 0x prefix and return deployed instance", async () => {
      const instance = await issueToDocumentStore({ ...deployParams, hash: addAddressPrefix("abcd") });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticIssue).toHaveBeenCalledTimes(1);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });
  });
});
