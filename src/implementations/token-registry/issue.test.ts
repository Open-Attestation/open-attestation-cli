import { issueToTokenRegistry } from "./issue";
import { join } from "path";
import { Wallet } from "ethers";
import { TradeTrustErc721Factory } from "@govtechsg/token-registry";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";

jest.mock("@govtechsg/token-registry");

const deployParams: TokenRegistryIssueCommand = {
  to: "0xabcd",
  tokenId: "0xzyxw",
  address: "0x1234",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustErc721Factory
// ideally must setup ganache, and run the function over it
describe("token-registry", () => {
  describe("issue", () => {
    const mockedTradeTrustErc721Factory: jest.Mock<TradeTrustErc721Factory> = TradeTrustErc721Factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedTradeTrustErc721Factory.connect;
    const mockedIssue = jest.fn();

    // eslint-disable-next-line jest/no-hooks
    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustErc721Factory.mockReset();
      mockedConnect.mockReset();
      mockedConnect.mockReturnValue({
        "safeMint(address,uint256)": mockedIssue,
      });
      mockedIssue.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await issueToTokenRegistry(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await issueToTokenRegistry({
        ...deployParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const instance = await issueToTokenRegistry({
        ...deployParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.to);
      expect(mockedIssue.mock.calls[0][1]).toEqual(deployParams.tokenId);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnect.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
