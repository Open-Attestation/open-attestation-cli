import { TitleEscrow__factory, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowEndorseTransferOfOwnersCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { getMockTitleEscrow, getMockTokenRegistry, initMockGetCode, mergeMockSmartContract } from "../testsHelpers";
import { transferOwners } from "./transferOwners";

jest.mock("@govtechsg/token-registry/contracts");

const endorseChangeOwnersParams: TitleEscrowEndorseTransferOfOwnersCommand = {
  newHolder: "0x0000000000000000000000000000000000000004",
  newOwner: "0x0000000000000000000000000000000000000004",
  tokenId: "0x0000000000000000000000000000000000000000000000000000000000000001",
  tokenRegistry: "0x0000000000000000000000000000000000000001",
  network: "goerli",
  dryRun: false,
};

const mockedTitleEscrowAddress = "0x0000000000000000000000000000000000000003";
// const mockedBeneficiary = "0x0000000000000000000000000000000000000004";
// const mockedHolder = "0xdsfls";
const walletAddress = `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`;

describe("title-escrow", () => {
  describe("endorse change of owners of transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;

    const mockTransferOwners = jest.fn();
    const mockCallStaticTransferOwners = jest.fn().mockResolvedValue(undefined);

    const mockBaseTokenRegistry = getMockTokenRegistry({ ownerOfValue: mockedTitleEscrowAddress });
    const mockTokenRegistry = mockBaseTokenRegistry;
    mockedConnectERC721.mockReturnValue(mockTokenRegistry);

    const mockBaseTitleEscrow = getMockTitleEscrow({
      beneficiaryValue: walletAddress,
      holderValue: walletAddress,
      nomineeValue: endorseChangeOwnersParams.newOwner,
    });
    const mockCustomTitleEscrow = {
      transferOwners: mockTransferOwners,
      callStatic: {
        transferOwners: mockCallStaticTransferOwners,
      },
    };
    const mockTitleEscrow = mergeMockSmartContract({ base: mockBaseTitleEscrow, override: mockCustomTitleEscrow });
    mockedConnectTokenFactory.mockReturnValue(mockTitleEscrow);
    mockTransferOwners.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    initMockGetCode();

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
      mockTransferOwners.mockClear();
      mockCallStaticTransferOwners.mockClear();
    });

    it("should pass in the correct params and call the following procedures to invoke an endorsement of change of owner of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await transferOwners({
        ...endorseChangeOwnersParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(endorseChangeOwnersParams.tokenRegistry, passedSigner);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticTransferOwners).toHaveBeenCalledTimes(1);
      expect(mockTransferOwners).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if new owner and new holder addresses are the same as current owner and holder addressses", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        transferOwners({
          ...endorseChangeOwnersParams,
          newOwner: walletAddress,
          newHolder: walletAddress,
          key: privateKey,
        })
      ).rejects.toThrow("Destination wallet already has the rights of holdership");
    });
  });
});
