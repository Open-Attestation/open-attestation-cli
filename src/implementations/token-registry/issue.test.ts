import { TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { addAddressPrefix } from "../../utils";
import { issueToTokenRegistry } from "./issue";

jest.mock("@tradetrust-tt/token-registry/contracts");

const deployParams: TokenRegistryIssueCommand = {
  beneficiary: "0xabcd",
  holder: "0xabce",
  tokenId: "0xzyxw",
  remark: "remark",
  encryptionKey: "0x1234",
  address: "0x1234",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

const deployParamsHederaTestnet: TokenRegistryIssueCommand = {
  beneficiary: "0xabcd",
  holder: "0xabce",
  tokenId: "0xzyxw",
  remark: "remark",
  encryptionKey: "0x1234",
  // "Test remark of 120 characters: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
  address: "0x1234",
  network: "hederatestnet",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("token-registry", () => {
  describe("issue", () => {
    jest.setTimeout(30000);
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockedIssue = jest.fn();
    const mockCallStaticSafeMint = jest.fn().mockResolvedValue(undefined);

    const mockTtErc721Contract = {
      mint: mockedIssue,
      callStatic: {
        mint: mockCallStaticSafeMint,
      },
    };

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockClear();
      mockCallStaticSafeMint.mockClear();
      mockedConnectERC721.mockReset();
      mockedConnectERC721.mockResolvedValue(mockTtErc721Contract);

      mockedIssue.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });
    it("should pass in the correct params and return the deployed instance", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const instance = await issueToTokenRegistry({
        ...deployParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.beneficiary);
      expect(mockedIssue.mock.calls[0][1]).toEqual(deployParams.holder);
      expect(mockedIssue.mock.calls[0][2]).toEqual(deployParams.tokenId);
      expect(mockCallStaticSafeMint).toHaveBeenCalledTimes(1);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept tokenId without 0x prefix and return deployed instance", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const instance = await issueToTokenRegistry({
        ...deployParams,
        key: privateKey,
        tokenId: addAddressPrefix("zyxw"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.beneficiary);
      expect(mockedIssue.mock.calls[0][1]).toEqual(deployParams.holder);
      expect(mockedIssue.mock.calls[0][2]).toEqual(deployParams.tokenId);
      expect(mockCallStaticSafeMint).toHaveBeenCalledTimes(1);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow("An Error");
    });

    //Hedera Testnet
    it("should pass in the correct params and return the deployed instance for hederatestnet", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const instance = await issueToTokenRegistry({
        ...deployParamsHederaTestnet,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.address);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.beneficiary);
      expect(mockedIssue.mock.calls[0][1]).toEqual(deployParamsHederaTestnet.holder);
      expect(mockedIssue.mock.calls[0][2]).toEqual(deployParamsHederaTestnet.tokenId);
      expect(mockCallStaticSafeMint).toHaveBeenCalledTimes(1);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept tokenId without 0x prefix and return deployed instance for hederatestnet", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const instance = await issueToTokenRegistry({
        ...deployParamsHederaTestnet,
        key: privateKey,
        tokenId: addAddressPrefix("zyxw"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.address);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.beneficiary);
      expect(mockedIssue.mock.calls[0][1]).toEqual(deployParamsHederaTestnet.holder);
      expect(mockedIssue.mock.calls[0][2]).toEqual(deployParamsHederaTestnet.tokenId);
      expect(mockCallStaticSafeMint).toHaveBeenCalledTimes(1);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should throw when keys are not found anywhere for hederatestnet", async () => {
      await expect(issueToTokenRegistry(deployParamsHederaTestnet)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    it("should allow errors to bubble up for hederatestnet", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(issueToTokenRegistry(deployParamsHederaTestnet)).rejects.toThrow("An Error");
    });
  });
});
