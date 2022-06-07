import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { join } from "path";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { addAddressPrefix } from "../../utils";
import { issueToTokenRegistry } from "./issue";
import { connectToTokenRegistry } from "./helpers";

jest.mock("@govtechsg/token-registry");
jest.mock("./helpers", () => {
  const originalModule = jest.requireActual("./helpers");
  return {
    __esModule: true,
    ...originalModule,
    connectToTokenRegistry: jest.fn(),
  };
});

const deployParams: TokenRegistryIssueCommand = {
  to: "0xabcd",
  tokenId: "0xzyxw",
  address: "0x1234",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustERC721Factory
// ideally must setup ganache, and run the function over it
describe("token-registry", () => {
  describe("issue", () => {
    jest.setTimeout(30000);
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721Factory> = TradeTrustERC721Factory as any;
    const mockedConnect = connectToTokenRegistry as jest.Mock;
    const mockedIssue = jest.fn();
    const mockCallStaticSafeMint = jest.fn().mockResolvedValue(undefined);

    mockedIssue.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    const mockTTERC721Contract = {
      mintTitle: mockedIssue,
      callStatic: {
        "mintTitle(address,address,uint256)": mockCallStaticSafeMint,
      },
    };

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustERC721Factory.mockClear();
      mockCallStaticSafeMint.mockClear();
      mockedConnect.mockReset();
      mockedConnect.mockResolvedValue({
        isV3: true,
        contract: mockTTERC721Contract,
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await issueToTokenRegistry(deployParams);
      const passedSigner: Wallet = mockedConnect.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await issueToTokenRegistry({
        ...deployParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const instance = await issueToTokenRegistry({
        ...deployParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnect.mock.calls[0][0]["address"]).toEqual(deployParams.address);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.to);
      expect(mockedIssue.mock.calls[0][1]).toEqual(deployParams.to);
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

      const passedSigner: Wallet = mockedConnect.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnect.mock.calls[0][0]["address"]).toEqual(deployParams.address);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.to);
      expect(mockedIssue.mock.calls[0][1]).toEqual(deployParams.to);
      expect(mockedIssue.mock.calls[0][2]).toEqual(deployParams.tokenId);
      expect(mockCallStaticSafeMint).toHaveBeenCalledTimes(1);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    it("should reject V2 minting", async () => {
      mockedConnect.mockResolvedValue({
        isV3: false,
        contract: mockTTERC721Contract,
      });
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });
  });
});
