import { TitleEscrow__factory, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowTransferHolderCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { getMockTitleEscrow, getMockTokenRegistry, initMockGetCode, mergeMockSmartContract } from "../testsHelpers";
import { transferHolder } from "./transferHolder";

jest.mock("@govtechsg/token-registry/contracts");

const transferHolderParams: TitleEscrowTransferHolderCommand = {
  newHolder: "0xabcd",
  tokenId: "0x0000000000000000000000000000000000000000000000000000000000000001",
  tokenRegistry: "0x0000000000000000000000000000000000000001",
  network: "goerli",
  dryRun: false,
};

const walletAddress = `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`;

describe("title-escrow", () => {
  describe("change holder of transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    // const mockedOwnerOf = jest.fn();
    const mockTransferHolder = jest.fn();
    const mockCallStaticTransferHolder = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x0000000000000000000000000000000000000003";
    mockTransferHolder.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    initMockGetCode();

    const mockBaseTokenRegistry = getMockTokenRegistry({ ownerOfValue: mockedTitleEscrowAddress });
    mockedConnectERC721.mockReturnValue(mockBaseTokenRegistry);

    const mockBaseTitleEscrow = getMockTitleEscrow({ beneficiaryValue: walletAddress, holderValue: walletAddress });
    const mockCustomTitleEscrow = {
      transferHolder: mockTransferHolder,
      callStatic: {
        transferHolder: mockCallStaticTransferHolder,
      },
    };
    const mockTitleEscrow = mergeMockSmartContract({ base: mockBaseTitleEscrow, override: mockCustomTitleEscrow });
    mockedConnectTokenFactory.mockReturnValue(mockTitleEscrow);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
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
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticTransferHolder).toHaveBeenCalledTimes(1);
      expect(mockTransferHolder).toHaveBeenCalledTimes(1);
    });
  });
});
