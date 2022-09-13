import { TitleEscrow__factory, TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowEndorseChangeOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { endorseChangeOfOwner } from "./changeOwner";

jest.mock("@govtechsg/token-registry/contracts");

const endorseChangeOwnerParams: TitleEscrowEndorseChangeOfOwnerCommand = {
  newHolder: "0xabcd",
  newOwner: "0fosui",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustERC721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("endorse change of owner of transferable record", () => {
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721__factory> = TradeTrustERC721__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustERC721Factory.connect;
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
      mockedTradeTrustERC721Factory.mockClear();
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
      await endorseChangeOfOwner({
        ...endorseChangeOwnerParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(endorseChangeOwnerParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(endorseChangeOwnerParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockGetBeneficiary).toHaveBeenCalledTimes(1);
      expect(mockGetHolder).toHaveBeenCalledTimes(1);
      expect(mockCallStaticTransferOwners).toHaveBeenCalledTimes(1);
      expect(mockTransferOwners).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if new owner and new holder addresses are the same as current owner and holder addressses", async () => {
      mockGetBeneficiary.mockReturnValue(endorseChangeOwnerParams.newOwner);
      mockGetHolder.mockReturnValue(endorseChangeOwnerParams.newHolder);
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        endorseChangeOfOwner({
          ...endorseChangeOwnerParams,
          key: privateKey,
        })
      ).rejects.toThrow("new owner and new holder addresses are the same as the current owner and holder addresses");
    });
  });
});
