import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { join } from "path";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { acceptSurrendered } from "./acceptSurrendered";
import { connectToTokenRegistry } from "../token-registry/helpers";

jest.mock("@govtechsg/token-registry");
jest.mock("../token-registry/helpers", () => {
  const originalModule = jest.requireActual("../token-registry/helpers");
  return {
    __esModule: true,
    ...originalModule,
    connectToTokenRegistry: jest.fn(),
  };
});

const acceptSurrenderedDocumentParams: TitleEscrowSurrenderDocumentCommand = {
  tokenRegistry: "0x1122",
  tokenId: "0x12345",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustERC721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("accepts surrendered transferable record", () => {
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721Factory> = TradeTrustERC721Factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = connectToTokenRegistry as jest.Mock;
    const mockDestroyToken = jest.fn();
    const mockCallStaticDestroyToken = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustERC721Factory.mockReset();
      mockedConnectERC721.mockReset();

      mockDestroyToken.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });

      mockedConnectERC721.mockReturnValue({
        isV3: true,
        contract: {
          destroyToken: mockDestroyToken,
          callStatic: {
            destroyToken: mockCallStaticDestroyToken,
          },
        },
      });
      mockDestroyToken.mockClear();
      mockCallStaticDestroyToken.mockClear();
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await acceptSurrendered(acceptSurrenderedDocumentParams);

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await acceptSurrendered({
        ...acceptSurrenderedDocumentParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and successfully accepts a surrendered transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await acceptSurrendered({
        ...acceptSurrenderedDocumentParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][0]["wallet"];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith({
        address: acceptSurrenderedDocumentParams.tokenRegistry,
        wallet: passedSigner,
      });
      expect(mockCallStaticDestroyToken).toHaveBeenCalledTimes(1);
      expect(mockDestroyToken).toHaveBeenCalledTimes(1);
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(acceptSurrendered(acceptSurrenderedDocumentParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(acceptSurrendered(acceptSurrenderedDocumentParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
