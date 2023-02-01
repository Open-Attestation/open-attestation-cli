import {
  TitleEscrowFactory__factory,
  TitleEscrow__factory,
  TradeTrustToken__factory,
} from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import {
  getMockTitleEscrow,
  getMockTitleEscrowFactory,
  getMockTokenRegistry,
  initMockGetCode,
  mergeMockSmartContract,
} from "../testsHelpers";
import { rejectSurrendered } from "./rejectSurrendered";

jest.mock("@govtechsg/token-registry/contracts");

const rejectSurrenderedDocumentParams: TitleEscrowSurrenderDocumentCommand = {
  tokenRegistry: "0x0000000000000000000000000000000000000001",
  tokenId: "0x0000000000000000000000000000000000000000000000000000000000000001",
  network: "goerli",
  dryRun: false,
};

const walletAddress = `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`;

describe("title-escrow", () => {
  describe("rejects surrendered transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    const mockedTitleEscrowFactory: jest.Mock<TitleEscrowFactory__factory> = TitleEscrow__factory as any;
    const mockedTitleEscrowFactoryFactory: jest.Mock<TitleEscrowFactory__factory> = TitleEscrowFactory__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrowFactory: jest.Mock = mockedTitleEscrowFactory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrowFactoryFactory: jest.Mock = mockedTitleEscrowFactoryFactory.connect;

    const mockRestoreTitle = jest.fn();
    const mockCallStaticRestoreTitle = jest.fn().mockResolvedValue(undefined);

    const mockedLastTitleEscrowAddress = "0x0000000000000000000000000000000000000003";
    initMockGetCode();

    const mockBaseTokenRegistry = getMockTokenRegistry({
      ownerOfValue: rejectSurrenderedDocumentParams.tokenRegistry,
      address: rejectSurrenderedDocumentParams.tokenRegistry,
    });

    const mockCustomTokenRegistry = {
      restore: mockRestoreTitle,
      callStatic: {
        restore: mockCallStaticRestoreTitle,
      },
    };
    const mockTokenRegistry = mergeMockSmartContract({
      base: mockBaseTokenRegistry,
      override: mockCustomTokenRegistry,
    });
    const mockTitleEscrow = getMockTitleEscrow({ beneficiaryValue: walletAddress, holderValue: walletAddress });
    const mockTitleEscrowFactory = getMockTitleEscrowFactory({ getAddressValue: mockedLastTitleEscrowAddress });

    mockRestoreTitle.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockReset();
      mockedConnectERC721.mockReset();
      mockedTitleEscrowFactory.mockReset();
      mockedConnectTitleEscrowFactory.mockReset();
      mockedConnectERC721.mockReturnValue(mockTokenRegistry);
      mockedConnectTitleEscrowFactory.mockReturnValue(mockTitleEscrow);
      mockedConnectTitleEscrowFactoryFactory.mockReturnValue(mockTitleEscrowFactory);
      mockRestoreTitle.mockClear();
      mockCallStaticRestoreTitle.mockClear();
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
  });
});
