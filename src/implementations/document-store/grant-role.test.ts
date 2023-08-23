import { grantDocumentStoreRole } from "./grant-role";

import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@govtechsg/document-store";
import { DocumentStoreRoleCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";
import { join } from "path";

jest.mock("@govtechsg/document-store");

const deployParams: DocumentStoreRoleCommand = {
  account: "0xabcd",
  role: "issuer",
  address: "0x1234",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of DocumentStoreFactory
// ideally must setup ganache, and run the function over it
describe("document-store", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("grant document store issuer role to wallet", () => {
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
    const mockedGrantRole = jest.fn();
    const mockedCallStaticGrantRole = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedConnect.mockReset();
      mockedCallStaticGrantRole.mockClear();
      mockedConnect.mockReturnValue({
        grantRole: mockedGrantRole,
        DEFAULT_ADMIN_ROLE: jest.fn().mockResolvedValue("ADMIN"),
        ISSUER_ROLE: jest.fn().mockResolvedValue("ISSUER"),
        REVOKER_ROLE: jest.fn().mockResolvedValue("REVOKER"),
        callStatic: {
          grantRole: mockedCallStaticGrantRole,
        },
      });
      mockedGrantRole.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });
    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await grantDocumentStoreRole(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedCallStaticGrantRole).toHaveBeenCalledTimes(1);
      expect(mockedGrantRole.mock.calls[0][0]).toEqual("ISSUER");
      expect(mockedGrantRole.mock.calls[0][1]).toEqual(deployParams.account);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept account without 0x prefix and return deployed instance", async () => {
      const instance = await grantDocumentStoreRole({
        ...deployParams,
        account: addAddressPrefix("abcd"),
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedCallStaticGrantRole).toHaveBeenCalledTimes(1);
      expect(mockedGrantRole.mock.calls[0][0]).toEqual("ISSUER");
      expect(mockedGrantRole.mock.calls[0][1]).toEqual(deployParams.account);

      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      await grantDocumentStoreRole({
        account: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        dryRun: false,
        role: "admin",
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });
    it("should take in the key from key file", async () => {
      await grantDocumentStoreRole({
        account: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        role: "admin",
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });
  });
});
