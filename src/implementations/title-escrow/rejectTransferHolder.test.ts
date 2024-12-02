import { TitleEscrow__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowRejectTransferCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { rejectTransferHolder } from "./rejectTransferHolder";

jest.mock("@tradetrust-tt/token-registry/contracts");

const transferHolderParams: TitleEscrowRejectTransferCommand = {
  remark: "0xabcd",
  encryptionKey: "1234",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("title-escrow", () => {
  describe("reject holder of transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;

    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockRejectTransferHolder = jest.fn();
    const mockCallStaticRejectTransferHolder = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x2133";

    const mockedPrevHolder = "0xdssfs";
    const mockGetPrevHolder = jest.fn();

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
      mockedOwnerOf.mockClear();
      mockRejectTransferHolder.mockClear();
      mockCallStaticRejectTransferHolder.mockClear();

      mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
      mockRejectTransferHolder.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
      mockGetPrevHolder.mockReturnValue(mockedPrevHolder);

      mockedConnectERC721.mockReturnValue({
        ownerOf: mockedOwnerOf,
      });
      mockedConnectTokenFactory.mockReturnValue({
        prevHolder: mockGetPrevHolder,
        rejectTransferHolder: mockRejectTransferHolder,
        callStatic: {
          rejectTransferHolder: mockCallStaticRejectTransferHolder,
        },
      });
    });

    it("should pass in the correct params and call the following procedures to invoke a reject holder of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await rejectTransferHolder({
        ...transferHolderParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(transferHolderParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(transferHolderParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticRejectTransferHolder).toHaveBeenCalledTimes(1);
      expect(mockRejectTransferHolder).toHaveBeenCalledTimes(1);
    });
    it("should throw error if remark is longer than 120 characters", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";

      await expect(
        rejectTransferHolder({
          ...transferHolderParams,
          remark: "0xabcd".repeat(31),
          key: privateKey,
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"Remark length is more than 120 characters"`);

      expect(mockCallStaticRejectTransferHolder).toHaveBeenCalledTimes(0);
    });
    it("should throw error if previous holder is not available", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      mockGetPrevHolder.mockReturnValue("0x0000000000000000000000000000000000000000");

      await expect(
        rejectTransferHolder({
          ...transferHolderParams,
          remark: "0xabcd",
          key: privateKey,
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"invalid rejection as previous holder is not set"`);

      expect(mockCallStaticRejectTransferHolder).toHaveBeenCalledTimes(0);
    });
  });
});
