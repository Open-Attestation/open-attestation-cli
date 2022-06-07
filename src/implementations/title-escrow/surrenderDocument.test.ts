import { TitleEscrowCloneableFactory, TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { join } from "path";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { surrenderDocument } from "./surrenderDocument";
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

const surrenderDocumentParams: TitleEscrowSurrenderDocumentCommand = {
  tokenRegistry: "0x1122",
  tokenId: "0x12345",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustERC721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("surrender transferable record", () => {
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721Factory> = TradeTrustERC721Factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = connectToTokenRegistry as jest.Mock;
    const mockedTitleEscrowFactory: jest.Mock<TitleEscrowCloneableFactory> = TitleEscrowCloneableFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrowFactory: jest.Mock = mockedTitleEscrowFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockSurrender = jest.fn();
    const mockCallStaticSurrender = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x2133";

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustERC721Factory.mockReset();
      mockedConnectERC721.mockReset();
      mockedTitleEscrowFactory.mockReset();
      mockedConnectTitleEscrowFactory.mockReset();

      mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
      mockSurrender.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
      mockedConnectERC721.mockReturnValue({
        isV3: true,
        contract: {
          ownerOf: mockedOwnerOf,
        },
      });
      mockedConnectTitleEscrowFactory.mockReturnValue({
        surrender: mockSurrender,
        callStatic: {
          surrender: mockCallStaticSurrender,
        },
      });

      mockedOwnerOf.mockClear();
      mockSurrender.mockClear();
      mockCallStaticSurrender.mockClear();
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await surrenderDocument(surrenderDocumentParams);

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await surrenderDocument({
        ...surrenderDocumentParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][0]["wallet"];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and successfully surrender a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await surrenderDocument({
        ...surrenderDocumentParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][0]["wallet"];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith({
        address: surrenderDocumentParams.tokenRegistry,
        wallet: passedSigner,
      });
      expect(mockedOwnerOf).toHaveBeenCalledWith(surrenderDocumentParams.tokenId);
      expect(mockedConnectTitleEscrowFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticSurrender).toHaveBeenCalledTimes(1);
      expect(mockSurrender).toHaveBeenCalledTimes(1);
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(surrenderDocument(surrenderDocumentParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(surrenderDocument(surrenderDocumentParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
