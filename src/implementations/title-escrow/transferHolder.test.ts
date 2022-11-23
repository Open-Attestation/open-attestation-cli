import { TitleEscrow__factory, TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowTransferHolderCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { transferHolder } from "./transferHolder";

jest.mock("@govtechsg/token-registry/contracts");

const transferHolderParams: TitleEscrowTransferHolderCommand = {
  newHolder: "0xabcd",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "goerli",
  maxPriorityFeePerGasScale: 1,
  feeData: false,
};

describe("title-escrow", () => {
  describe("change holder of transferable record", () => {
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721__factory> = TradeTrustERC721__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustERC721Factory.connect;

    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockTransferHolder = jest.fn();
    const mockCallStaticTransferHolder = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x2133";
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockTransferHolder.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });
    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      transferHolder: mockTransferHolder,
      callStatic: {
        transferHolder: mockCallStaticTransferHolder,
      },
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustERC721Factory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
      mockedOwnerOf.mockClear();
      mockTransferHolder.mockClear();
      mockCallStaticTransferHolder.mockClear();
    });

    it("should pass in the correct params and call the following procedures to invoke a change in holder of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await transferHolder({
        ...transferHolderParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(transferHolderParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(transferHolderParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticTransferHolder).toHaveBeenCalledTimes(1);
      expect(mockTransferHolder).toHaveBeenCalledTimes(1);
    });
  });
});
