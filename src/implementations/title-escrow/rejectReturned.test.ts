import { TitleEscrow__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { rejectReturned } from "./rejectReturned";

jest.mock("@tradetrust-tt/token-registry/contracts");

const rejectReturnedDocumentParams: TitleEscrowReturnDocumentCommand = {
  tokenRegistry: "0x1122",
  tokenId: "0x12345",
  remark: "0xabcd",
  encryptionKey: "1234",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("title-escrow", () => {
  describe("rejects returned transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
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
      mockedTradeTrustTokenFactory.mockReset();
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

    it("should pass in the correct params and successfully rejects a returned transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await rejectReturned({
        ...rejectReturnedDocumentParams,
        key: privateKey,
      });
      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(rejectReturnedDocumentParams.tokenRegistry, passedSigner);
      expect(mockCallStaticRestoreTitle).toHaveBeenCalledTimes(1);
      expect(mockRestoreTitle.mock.calls[0][0]).toBe(rejectReturnedDocumentParams.tokenId);
    });
  });
});
