import { TitleEscrow__factory, TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";
import { join } from "path";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { rejectSurrendered } from "./rejectSurrendered";

jest.mock("@govtechsg/token-registry/contracts");

const rejectSurrenderedDocumentParams: TitleEscrowSurrenderDocumentCommand = {
  tokenRegistry: "0x1122",
  tokenId: "0x12345",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustERC721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("rejects surrendered transferable record", () => {
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721__factory> = TradeTrustERC721__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustERC721Factory.connect;
    const mockedTitleEscrowFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrowFactory: jest.Mock = mockedTitleEscrowFactory.connect;

    const mockedBeneficiary = jest.fn();
    const mockedHolder = jest.fn();
    const mockRestoreTitle = jest.fn();
    const mockTransferEvent = jest.fn();
    const mockQueryFilter = jest.fn();
    const mockCallStaticRestoreTitle = jest.fn().mockResolvedValue(undefined);

    const mockedLastTitleEscrowAddress = "0xMockedLastTitleEscrowAddress";
    const mockedLastBeneficiary = "0xMockedLastBeneficiaryAddress";
    const mockedLastHolder = "0xMockedLastHolderAddress";

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustERC721Factory.mockReset();
      mockedConnectERC721.mockReset();
      mockedTitleEscrowFactory.mockReset();
      mockedConnectTitleEscrowFactory.mockReset();

      mockedBeneficiary.mockReturnValue(mockedLastBeneficiary);
      mockedHolder.mockReturnValue(mockedLastHolder);
      mockRestoreTitle.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
      mockTransferEvent.mockReturnValue({
        address: "0x1122",
        topics: ["0x00000", null, null, "0x12345"],
      });
      mockQueryFilter.mockReturnValue([
        {
          args: [mockedLastTitleEscrowAddress, "0x1122"],
        },
      ]);

      mockedConnectTitleEscrowFactory.mockReturnValue({
        beneficiary: mockedBeneficiary,
        holder: mockedHolder,
      });
      mockedConnectERC721.mockReturnValue({
        restore: mockRestoreTitle,
        filters: { Transfer: mockTransferEvent },
        queryFilter: mockQueryFilter,
        callStatic: {
          restore: mockCallStaticRestoreTitle,
        },
      });
      mockedBeneficiary.mockClear();
      mockedHolder.mockClear();
      mockRestoreTitle.mockClear();
      mockTransferEvent.mockClear();
      mockQueryFilter.mockClear();
      mockCallStaticRestoreTitle.mockClear();
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await rejectSurrendered(rejectSurrenderedDocumentParams);

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await rejectSurrendered({
        ...rejectSurrenderedDocumentParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and successfully rejects a surrendered transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await rejectSurrendered({
        ...rejectSurrenderedDocumentParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(rejectSurrenderedDocumentParams.tokenRegistry, passedSigner);
      expect(mockCallStaticRestoreTitle).toHaveBeenCalledTimes(1);
      expect(mockRestoreTitle).toHaveBeenCalledWith(rejectSurrenderedDocumentParams.tokenId);
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(rejectSurrendered(rejectSurrenderedDocumentParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(rejectSurrendered(rejectSurrenderedDocumentParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
