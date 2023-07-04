import { TitleEscrow__factory, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowEndorseTransferOfOwnersCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { transferOwners } from "./transferOwners";

jest.mock("@govtechsg/token-registry/contracts");

const endorseChangeOwnersParams: TitleEscrowEndorseTransferOfOwnersCommand = {
  newHolder: "0xabcd",
  newOwner: "0fosui",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "sepolia",
  dryRun: false,
};

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
    const mockedOwnerOf = jest.fn();
    const mockTransferOwners = jest.fn();
    const mockCallStaticTransferOwners = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x2133";
    const mockedBeneficiary = "0xdssfs";
    const mockedHolder = "0xdsfls";
    const mockGetBeneficiary = jest.fn();
    const mockGetHolder = jest.fn();
    mockGetBeneficiary.mockReturnValue(mockedBeneficiary);
    mockGetHolder.mockReturnValue(mockedHolder);
    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      transferOwners: mockTransferOwners,
      beneficiary: mockGetBeneficiary,
      holder: mockGetHolder,
      callStatic: {
        transferOwners: mockCallStaticTransferOwners,
      },
    });
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockTransferOwners.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
      mockedOwnerOf.mockClear();
      mockTransferOwners.mockClear();
      mockGetBeneficiary.mockClear();
      mockGetHolder.mockClear();
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
      expect(mockedOwnerOf).toHaveBeenCalledWith(endorseChangeOwnersParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockGetBeneficiary).toHaveBeenCalledTimes(1);
      expect(mockGetHolder).toHaveBeenCalledTimes(1);
      expect(mockCallStaticTransferOwners).toHaveBeenCalledTimes(1);
      expect(mockTransferOwners).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if new owner and new holder addresses are the same as current owner and holder addressses", async () => {
      mockGetBeneficiary.mockReturnValue(endorseChangeOwnersParams.newOwner);
      mockGetHolder.mockReturnValue(endorseChangeOwnersParams.newHolder);
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        transferOwners({
          ...endorseChangeOwnersParams,
          key: privateKey,
        })
      ).rejects.toThrow("new owner and new holder addresses are the same as the current owner and holder addresses");
    });
  });
});
