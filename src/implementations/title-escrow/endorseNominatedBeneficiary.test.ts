import { TitleEscrow__factory, TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { getMockTitleEscrow, getMockTokenRegistry, initMockGetCode, mergeMockSmartContract } from "../testsHelpers";
import { endorseNominatedBeneficiary } from "./endorseNominatedBeneficiary";

jest.mock("@govtechsg/token-registry/contracts");

const endorseNominatedBeneficiaryParams: TitleEscrowNominateBeneficiaryCommand = {
  tokenId: "0x0000000000000000000000000000000000000000000000000000000000000001",
  tokenRegistry: "0x0000000000000000000000000000000000000001",
  newBeneficiary: "0x0000000000000000000000000000000000000002",
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

    const walletAddress = `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`;

    const mockedTitleEscrowAddress = "0x0000000000000000000000000000000000000003";
    const mockedOwnerOf = jest.fn();
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);

    const mockTransferOwners = jest.fn();
    const mockCallStaticTransferOwners = jest.fn().mockResolvedValue(undefined);

    const mockedBeneficiary = "0x0000000000000000000000000000000000000004";
    const mockGetBeneficiary = jest.fn();
    mockGetBeneficiary.mockReturnValue(mockedBeneficiary);

    const mockBaseTokenRegistry = getMockTokenRegistry({
      ownerOfValue: mockedTitleEscrowAddress,
      address: endorseNominatedBeneficiaryParams.tokenRegistry,
    });
    const mockTokenRegistry = mockBaseTokenRegistry;
    const mockBaseTitleEscrow = getMockTitleEscrow({
      holderValue: walletAddress,
      beneficiaryValue: walletAddress,
      nomineeValue: endorseNominatedBeneficiaryParams.newBeneficiary,
    });

    mockedConnectERC721.mockReturnValue(mockTokenRegistry);

    const customMockTitleEscrow = {
      transferBeneficiary: mockTransferOwners,
      // beneficiary: mockGetBeneficiary,
      callStatic: {
        transferBeneficiary: mockCallStaticTransferOwners,
      },
    };

    const mockTitleEscrow = mergeMockSmartContract({ base: mockBaseTitleEscrow, override: customMockTitleEscrow });

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
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticTransferOwners).toHaveBeenCalledTimes(1);
      expect(mockTransferOwners).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if nominee is the owner address", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        endorseNominatedBeneficiary({
          ...endorseNominatedBeneficiaryParams,
          newBeneficiary: walletAddress,
          key: privateKey,
        })
      ).rejects.toThrow(`Destination wallet already has the rights as beneficiary`);
    });
  });
});
