import { DocumentStoreFactory } from "@govtechsg/document-store";
import { prompt } from "inquirer";
import { mocked } from "ts-jest/utils";
import { CreateConfigCommand, DocumentStoreProps } from "../../../commands/config/config.type";
import * as DnsCreateTxtRecordCommand from "../../../commands/dns/txt-record/create";
import { createTempDNS, deployDocumentStore } from "../create";

jest.mock("@govtechsg/document-store");
jest.mock("@govtechsg/token-registry");
jest.mock("inquirer");
jest.mock("request");

const promptMock = mocked(prompt);

const deployDnsParams: CreateConfigCommand = {
  outputFile: "",
  encryptedWalletPath: "",
  sandboxEndpoint: "https://sandbox.openattestation.com",
  gasPriceScale: 1,
  dryRun: true,
};

const deployDocStoreParams: DocumentStoreProps = {
  storeName: "Test Document Store",
  network: "ropsten",
  walletJson:
    '{"address":"709731d94d65b078496937655582401157c8a640","id":"90167e7e-af5c-44b1-a6a3-2525300d1032","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"02004e981623b906938a205c24805bef"},"ciphertext":"06568387223b88fe860bfed23442966124fe38e463fdb5501a0a0f8b9d1519db","kdf":"scrypt","kdfparams":{"salt":"56b3c1e89f4d8a3f76564d4e6f64e832e46729c881764328a4509a2e96c052fe","n":131072,"dklen":32,"p":1,"r":8},"mac":"7611744a709d7cac37379617e8ddd9f134658b7a99b09f55eeaa50b4af6e0d39"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2021-02-01T06-07-08.0Z--709731d94d65b078496937655582401157c8a640","mnemonicCounter":"f2706de1481a3541e7b49885f9a21fa7","mnemonicCiphertext":"7eb14f3487659d100e5dddac1cef72dd","path":"m/44\'/60\'/0\'/0/0","locale":"en","version":"0.1"}}',
  gasPriceScale: 1,
};

describe("document-store", () => {
  const documentStoreFactory: any = DocumentStoreFactory;
  const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = documentStoreFactory;
  const mockedDeploy: jest.Mock = mockedDocumentStoreFactory.prototype.deploy;

  beforeEach(() => {
    delete process.env.OA_PRIVATE_KEY;
    mockedDocumentStoreFactory.mockReset();
    mockedDeploy.mockReset();
    mockedDeploy.mockResolvedValue({
      deployTransaction: { hash: "hash", wait: () => Promise.resolve({ contractAddress: "contractAddress" }) },
    });
  });
  describe("deployDocumentStore", () => {
    // increase timeout because ethers is throttling
    jest.setTimeout(30000);

    it("should pass in the correct params and return the deployed instance", async () => {
      promptMock.mockResolvedValueOnce({ password: "password" }); // wallet password
      const instance = await deployDocumentStore(deployDocStoreParams);

      expect(mockedDeploy.mock.calls[0][0]).toStrictEqual(deployDocStoreParams.storeName);
      // price should be any length string of digits
      expect(mockedDeploy.mock.calls[0][1].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      promptMock.mockResolvedValueOnce({ password: "password" }); // wallet password
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployDocumentStore(deployDocStoreParams)).rejects.toThrow("An Error");
    });

    it("should throw when wallet is not found", async () => {
      await expect(
        deployDocumentStore({
          storeName: "Test",
          network: "ropsten",
          walletJson: "",
          gasPriceScale: 1,
        })
      ).rejects.toThrow("No encrypted wallet found");
    });
  });

  describe("Create dns record for Document Store", () => {
    it("should create dns record successfully", async () => {
      const expectedResult = {
        name: "excellent-amethyst-swift.sandbox.openattestation.com",
        expiryDate: "2021-02-09T04:44:54.227Z",
      };
      const promise = Promise.resolve(expectedResult as any);
      const mock = jest.spyOn(DnsCreateTxtRecordCommand, "request");
      mock.mockReturnValue(promise);
      const result = await createTempDNS(deployDnsParams);
      expect(mock).toHaveBeenCalledTimes(2);
      expect(result).toBe(expectedResult);
      mock.mockRestore();
    });
  });
});
