import { revokeDocumentStoreRole } from "./revoke-role";

import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import { DocumentStoreRoleCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";
import { join } from "path";

jest.mock("@tradetrust-tt/document-store");

const deployParams: DocumentStoreRoleCommand = {
  account: "0xabcd",
  role: "issuer",
  address: "0x1234",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  dryRun: false,
  maxPriorityFeePerGasScale: 1,
};

// TODO the following test is very fragile and might break on every interface change of DocumentStoreFactory
// ideally must setup ganache, and run the function over it
describe("document-store", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("revoke document store issuer role to wallet", () => {
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
    const mockedRevokeRole = jest.fn();
    const mockedCallStaticRevokeRole = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedConnect.mockReset();
      mockedCallStaticRevokeRole.mockClear();
      mockedConnect.mockReturnValue({
        revokeRole: mockedRevokeRole,
        DEFAULT_ADMIN_ROLE: jest.fn().mockResolvedValue("ADMIN"),
        ISSUER_ROLE: jest.fn().mockResolvedValue("ISSUER"),
        REVOKER_ROLE: jest.fn().mockResolvedValue("REVOKER"),
        callStatic: {
          revokeRole: mockedCallStaticRevokeRole,
        },
      });
      mockedRevokeRole.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });
    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await revokeDocumentStoreRole(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedCallStaticRevokeRole).toHaveBeenCalledTimes(1);
      expect(mockedRevokeRole.mock.calls[0][0]).toEqual("ISSUER");
      expect(mockedRevokeRole.mock.calls[0][1]).toEqual(deployParams.account);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept account without 0x prefix and return deployed instance", async () => {
      const instance = await revokeDocumentStoreRole({
        ...deployParams,
        account: addAddressPrefix("abcd"),
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedCallStaticRevokeRole).toHaveBeenCalledTimes(1);
      expect(mockedRevokeRole.mock.calls[0][0]).toEqual("ISSUER");
      expect(mockedRevokeRole.mock.calls[0][1]).toEqual(deployParams.account);

      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      await revokeDocumentStoreRole({
        account: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        dryRun: false,
        role: "admin",
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });
    it("should take in the key from key file", async () => {
      await revokeDocumentStoreRole({
        account: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        role: "admin",
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });
  });
});
