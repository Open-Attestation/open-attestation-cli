import { TitleEscrow__factory, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { getMockTitleEscrow, getMockTokenRegistry, initMockGetCode, mergeMockSmartContract } from "../testsHelpers";
import { surrenderDocument } from "./surrenderDocument";

jest.mock("@govtechsg/token-registry/contracts");

const surrenderDocumentParams: TitleEscrowSurrenderDocumentCommand = {
  tokenRegistry: "0x0000000000000000000000000000000000000001",
  tokenId: "0x0000000000000000000000000000000000000000000000000000000000000001",
  network: "goerli",
  dryRun: false,
};
const walletAddress = `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`;
describe("title-escrow", () => {
  describe("surrender transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockedTitleEscrowFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrowFactory: jest.Mock = mockedTitleEscrowFactory.connect;
    // const mockedOwnerOf = jest.fn();
    const mockSurrender = jest.fn();
    const mockCallStaticSurrender = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x0000000000000000000000000000000000000003";
    initMockGetCode();

    const mockBaseTokenRegistry = getMockTokenRegistry({ ownerOfValue: mockedTitleEscrowAddress });
    const mockTokenRegistry = mockBaseTokenRegistry;

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockReset();
      mockedConnectERC721.mockReset();
      mockedTitleEscrowFactory.mockReset();
      mockedConnectTitleEscrowFactory.mockReset();
      mockSurrender.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });

      mockedConnectERC721.mockReturnValue(mockTokenRegistry);

      const mockBaseTitleEscrow = getMockTitleEscrow({ beneficiaryValue: walletAddress, holderValue: walletAddress });
      const mockCustomTitleEscrow = {
        surrender: mockSurrender,
        callStatic: {
          surrender: mockCallStaticSurrender,
        },
      };
      const mockTitleEscrow = mergeMockSmartContract({ base: mockBaseTitleEscrow, override: mockCustomTitleEscrow });
      mockedConnectTitleEscrowFactory.mockReturnValue(mockTitleEscrow);
      mockSurrender.mockClear();
      mockCallStaticSurrender.mockClear();
    });
    it("should pass in the correct params and successfully surrender a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await surrenderDocument({
        ...surrenderDocumentParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(surrenderDocumentParams.tokenRegistry, passedSigner);
      expect(mockedConnectTitleEscrowFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticSurrender).toHaveBeenCalledTimes(1);
      expect(mockSurrender).toHaveBeenCalledTimes(1);
    });
  });
});
