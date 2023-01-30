import {
  TitleEscrowFactory__factory,
  TitleEscrow__factory,
  TradeTrustToken__factory,
} from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowSurrenderDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import {
  AddressZero,
  getMockTitleEscrow,
  getMockTitleEscrowFactory,
  getMockTokenRegistry,
  mergeMockSmartContract,
} from "../testsHelpers";
import { acceptSurrendered } from "./acceptSurrendered";

jest.mock("@govtechsg/token-registry/contracts");

const acceptSurrenderedDocumentParams: TitleEscrowSurrenderDocumentCommand = {
  tokenRegistry: "0x0000000000000000000000000000000000000001",
  tokenId: "0x0000000000000000000000000000000000000000000000000000000000000001",
  network: "goerli",
  dryRun: false,
};

const walletAddress = `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`;

describe("title-escrow", () => {
  describe("accepts surrendered transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    const mockedTitleEscrowFactory: jest.Mock<TitleEscrowFactory__factory> = TitleEscrow__factory as any;
    const mockedTitleEscrowFactoryFactory: jest.Mock<TitleEscrowFactory__factory> = TitleEscrowFactory__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrowFactory: jest.Mock = mockedTitleEscrowFactoryFactory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrow: jest.Mock = mockedTitleEscrowFactory.connect;
    const mockBurnToken = jest.fn();
    const mockCallStaticBurnToken = jest.fn().mockResolvedValue(undefined);

    const tokenRegistryAddress = acceptSurrenderedDocumentParams.tokenRegistry;
    const mockBaseTokenRegistry = getMockTokenRegistry({
      ownerOfValue: tokenRegistryAddress,
      address: tokenRegistryAddress,
      titleEscrowAddress: AddressZero,
    });
    let mockTokenRegistry = mockBaseTokenRegistry;
    const mockTitleEscrowFactory = getMockTitleEscrowFactory({});
    const mockTitleEscrow = getMockTitleEscrow({ holderValue: walletAddress, beneficiaryValue: walletAddress });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockReset();
      mockedConnectERC721.mockReset();
      mockBurnToken.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
      const mockCustomTokenRegistry = {
        burn: mockBurnToken,
        callStatic: {
          genesis: jest.fn().mockResolvedValue(0),
          burn: mockCallStaticBurnToken,
        },
      };

      mockTokenRegistry = mergeMockSmartContract({ base: mockBaseTokenRegistry, override: mockCustomTokenRegistry });
      mockedConnectERC721.mockReturnValue(mockTokenRegistry);
      mockedConnectTitleEscrow.mockReturnValue(mockTitleEscrow);
      mockedConnectTitleEscrowFactory.mockReturnValue(mockTitleEscrowFactory);
      mockBurnToken.mockClear();
      mockCallStaticBurnToken.mockClear();
    });
    it("should pass in the correct params and successfully accepts a surrendered transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await acceptSurrendered({
        ...acceptSurrenderedDocumentParams,
        key: privateKey,
      });
      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(acceptSurrenderedDocumentParams.tokenRegistry, passedSigner);
      expect(mockBurnToken).toHaveBeenCalledTimes(1);
    });
  });
});
