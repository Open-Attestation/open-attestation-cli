import { TitleEscrow__factory, TradeTrustERC721__factory } from "@govtechsg/token-registry/contracts";
import { Wallet, constants } from "ethers";

import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { endorseNominatedBeneficiary } from "./endorseNominatedBeneficiary";

jest.mock("@govtechsg/token-registry/contracts");

const endorseNominatedBeneficiaryParams: TitleEscrowNominateBeneficiaryCommand = {
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  newOwner: "0x1232",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};
const GENESIS_ADDRESS = constants.AddressZero;

// TODO the following test is very fragile and might break on every interface change of TradeTrustERC721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("endorse transfer of owner of transferable record", () => {
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721__factory> = TradeTrustERC721__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustERC721Factory.connect;
    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockTransferToNewEscrow = jest.fn();
    const mockedTitleEscrowAddress = "0x2133";
    const mockedApprovedBeneficiary = "0xdssfs";
    const mockedApprovedHolder = "0xdsfls";
    const mockGetApprovedBeneficiary = jest.fn();
    const mockGetApprovedHolder = jest.fn();
    const mockCallStaticTransferToNewEscrow = jest.fn().mockResolvedValue(undefined);
    mockGetApprovedBeneficiary.mockReturnValue(mockedApprovedBeneficiary);
    mockGetApprovedHolder.mockReturnValue(mockedApprovedHolder);
    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      transferToNewEscrow: mockTransferToNewEscrow,
      approvedBeneficiary: mockGetApprovedBeneficiary,
      approvedHolder: mockGetApprovedHolder,
      callStatic: {
        transferToNewEscrow: mockCallStaticTransferToNewEscrow,
      },
    });
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockTransferToNewEscrow.mockReturnValue({
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
      mockTransferToNewEscrow.mockClear();
      mockGetApprovedBeneficiary.mockClear();
      mockGetApprovedHolder.mockClear();
      mockCallStaticTransferToNewEscrow.mockClear();
    });

    it("should pass in the correct params and call the following procedures to invoke an endorsement of transfer of owner of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await endorseNominatedBeneficiary({
        ...endorseNominatedBeneficiaryParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(endorseNominatedBeneficiaryParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(endorseNominatedBeneficiaryParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockGetApprovedBeneficiary).toHaveBeenCalledTimes(1);
      expect(mockGetApprovedHolder).toHaveBeenCalledTimes(1);
      expect(mockCallStaticTransferToNewEscrow).toHaveBeenCalledTimes(1);
      expect(mockTransferToNewEscrow).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if approved owner or approved holder addresses is the Genesis address", async () => {
      mockGetApprovedBeneficiary.mockReturnValue(GENESIS_ADDRESS);
      mockGetApprovedHolder.mockReturnValue(GENESIS_ADDRESS);
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        endorseNominatedBeneficiary({
          ...endorseNominatedBeneficiaryParams,
          key: privateKey,
        })
      ).rejects.toThrow(
        `there is no approved owner or holder or the approved owner or holder is equal to the genesis address: ${GENESIS_ADDRESS}`
      );
    });

    it("should throw an error if approved owner or approved holder addresses does not exist", async () => {
      mockGetApprovedBeneficiary.mockReturnValue("");
      mockGetApprovedHolder.mockReturnValue("");
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        endorseNominatedBeneficiary({
          ...endorseNominatedBeneficiaryParams,
          key: privateKey,
        })
      ).rejects.toThrow(
        `there is no approved owner or holder or the approved owner or holder is equal to the genesis address: ${GENESIS_ADDRESS}`
      );
    });
  });
});
