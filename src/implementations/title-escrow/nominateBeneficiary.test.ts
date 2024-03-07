import { TitleEscrow__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { TitleEscrowNominateBeneficiaryCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { nominateBeneficiary } from "./nominateBeneficiary";

jest.mock("@tradetrust-tt/token-registry/contracts");

const nominateBeneficiaryParams: TitleEscrowNominateBeneficiaryCommand = {
  newBeneficiary: "0fosui",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("title-escrow", () => {
  describe("nominate change of owner of transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockNominateBeneficiary = jest.fn();
    const mockedTitleEscrowAddress = "0x2133";
    const mockedBeneficiary = "0xdssfs";
    const mockedHolder = "0xdsfls";
    const mockGetBeneficiary = jest.fn();
    const mockGetHolder = jest.fn();
    const mockCallStaticNominateBeneficiary = jest.fn().mockResolvedValue(undefined);
    mockGetBeneficiary.mockResolvedValue(mockedBeneficiary);
    mockGetHolder.mockResolvedValue(mockedHolder);
    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      nominate: mockNominateBeneficiary,
      beneficiary: mockGetBeneficiary,
      holder: mockGetHolder,
      callStatic: {
        nominate: mockCallStaticNominateBeneficiary,
      },
    });
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockNominateBeneficiary.mockReturnValue({
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
      mockNominateBeneficiary.mockClear();
      mockGetBeneficiary.mockClear();
      mockGetHolder.mockClear();
      mockCallStaticNominateBeneficiary.mockClear();
    });

    it("should pass in the correct params and call the following procedures to invoke an nomination of change of owner of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await nominateBeneficiary({
        ...nominateBeneficiaryParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(nominateBeneficiaryParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(nominateBeneficiaryParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticNominateBeneficiary).toHaveBeenCalledTimes(1);
      expect(mockNominateBeneficiary).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if new owner addresses is the same as current owner", async () => {
      mockGetBeneficiary.mockReturnValue(nominateBeneficiaryParams.newBeneficiary);
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        nominateBeneficiary({
          ...nominateBeneficiaryParams,
          key: privateKey,
        }),
      ).rejects.toThrow("new beneficiary address is the same as the current beneficiary address");
    });
  });
});
