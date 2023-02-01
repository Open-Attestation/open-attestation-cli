import { revokeToDocumentStore } from "./revoke";

import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { DocumentStoreRevokeCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";

jest.mock("@govtechsg/document-store");

const deployParams: DocumentStoreRevokeCommand = {
  hash: "0xabcd",
  address: "0x1234",
  network: "goerli",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  dryRun: false,
};

describe("document-store", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("revokeDocumentStore", () => {
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
    const mockedRevoke = jest.fn();
    const mockCallStaticRevoke = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedConnect.mockReset();
      mockCallStaticRevoke.mockClear();
      mockedConnect.mockReturnValue({
        revoke: mockedRevoke,
        callStatic: {
          revoke: mockCallStaticRevoke,
        },
      });
      mockedRevoke.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });
    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await revokeToDocumentStore(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticRevoke).toHaveBeenCalledTimes(1);
      expect(mockedRevoke.mock.calls[0][0]).toEqual(deployParams.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept hash without 0x prefix and return deployed instance", async () => {
      const instance = await revokeToDocumentStore({ ...deployParams, hash: addAddressPrefix("abcd") });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticRevoke).toHaveBeenCalledTimes(1);
      expect(mockedRevoke.mock.calls[0][0]).toEqual(deployParams.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });
  });
});
