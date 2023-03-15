import { TitleEscrow__factory, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { endorseNominatedBeneficiary } from "./endorseNominatedBeneficiary";

jest.mock("@govtechsg/token-registry/contracts");

const endorseNominatedBeneficiaryParams: TitleEscrowNominateBeneficiaryCommand = {
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  newBeneficiary: "0x1232",
  network: "goerli",
  dryRun: false,
};

describe("title-escrow", () => {
  describe("endorse transfer of owner of transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;

    const mockedTitleEscrowAddress = "0x2133";
    const mockedOwnerOf = jest.fn();
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);

    const mockTransferOwners = jest.fn();
    const mockCallStaticTransferOwners = jest.fn().mockResolvedValue(undefined);

    const mockedBeneficiary = "0xdssfs";
    const mockGetBeneficiary = jest.fn();
    mockGetBeneficiary.mockReturnValue(mockedBeneficiary);

    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });

    mockedConnectTokenFactory.mockReturnValue({
      transferBeneficiary: mockTransferOwners,
      beneficiary: mockGetBeneficiary,
      callStatic: {
        transferBeneficiary: mockCallStaticTransferOwners,
      },
    });
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
      mockCallStaticTransferOwners.mockClear();
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
      expect(mockCallStaticTransferOwners).toHaveBeenCalledTimes(1);
      expect(mockTransferOwners).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if nominee is the owner address", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        endorseNominatedBeneficiary({
          ...endorseNominatedBeneficiaryParams,
          newBeneficiary: "0xdssfs",
          key: privateKey,
        })
      ).rejects.toThrow(`new beneficiary address is the same as the current beneficiary address`);
    });
  });
});
