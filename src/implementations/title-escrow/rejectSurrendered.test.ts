import { TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";
import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { rejectSurrendered } from "./rejectSurrendered";
import { getMockTokenRegistry, initMockGetCode, mergeMockSmartContract } from "../testsHelper";

jest.mock("@govtechsg/token-registry/contracts");

const rejectSurrenderedDocumentParams: TitleEscrowSurrenderDocumentCommand = {
  tokenRegistry: "0x0000000000000000000000000000000000000001",
  tokenId: "0x0000000000000000000000000000000000000000000000000000000000000001",
  network: "goerli",
  dryRun: false,
};

describe("title-escrow", () => {
  describe("rejects surrendered transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockRestoreTitle = jest.fn();
    const mockCallStaticRestoreTitle = jest.fn().mockResolvedValue(undefined);

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

    mockRestoreTitle.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockReset();
      mockedConnectERC721.mockReset();
      mockedConnectERC721.mockReturnValue(mockTokenRegistry);
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
