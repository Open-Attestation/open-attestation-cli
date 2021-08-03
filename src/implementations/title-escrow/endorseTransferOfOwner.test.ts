import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
import { Wallet, constants } from "ethers";
import { join } from "path";
import { BaseTitleEscrowCommand as TitleEscrowEndorseTransferOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { endorseTransferOfOwner } from "./endorseTransferOfOwner";

jest.mock("@govtechsg/token-registry");

const endorseTransferOfOwnerParams: TitleEscrowEndorseTransferOfOwnerCommand = {
  tokenId: "0xzyxw",
  address: "0x1234",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};
const GENESIS_ADDRESS = constants.AddressZero;

// TODO the following test is very fragile and might break on every interface change of TradeTrustErc721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("endorse transfer of owner of transferable record", () => {
    const mockedTradeTrustErc721Factory: jest.Mock<TradeTrustErc721Factory> = TradeTrustErc721Factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustErc721Factory.connect;
    const mockedTokenFactory: jest.Mock<TitleEscrowFactory> = TitleEscrowFactory as any;
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
    mockGetApprovedBeneficiary.mockReturnValue(mockedApprovedBeneficiary);
    mockGetApprovedHolder.mockReturnValue(mockedApprovedHolder);
    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      transferToNewEscrow: mockTransferToNewEscrow,
      approvedBeneficiary: mockGetApprovedBeneficiary,
      approvedHolder: mockGetApprovedHolder,
    });
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockTransferToNewEscrow.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustErc721Factory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
      mockedOwnerOf.mockClear();
      mockTransferToNewEscrow.mockClear();
      mockGetApprovedBeneficiary.mockClear();
      mockGetApprovedHolder.mockClear();
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await endorseTransferOfOwner(endorseTransferOfOwnerParams);

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await endorseTransferOfOwner({
        ...endorseTransferOfOwnerParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and call the following procedures to invoke an endorsement of transfer of owner of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await endorseTransferOfOwner({
        ...endorseTransferOfOwnerParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(endorseTransferOfOwnerParams.address, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(endorseTransferOfOwnerParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockGetApprovedBeneficiary).toHaveBeenCalledTimes(1);
      expect(mockGetApprovedHolder).toHaveBeenCalledTimes(1);
      expect(mockTransferToNewEscrow).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if approved owner or approved holder addresses is the Genesis address", async () => {
      mockGetApprovedBeneficiary.mockReturnValue(GENESIS_ADDRESS);
      mockGetApprovedHolder.mockReturnValue(GENESIS_ADDRESS);
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        endorseTransferOfOwner({
          ...endorseTransferOfOwnerParams,
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
        endorseTransferOfOwner({
          ...endorseTransferOfOwnerParams,
          key: privateKey,
        })
      ).rejects.toThrow(
        `there is no approved owner or holder or the approved owner or holder is equal to the genesis address: ${GENESIS_ADDRESS}`
      );
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(endorseTransferOfOwner(endorseTransferOfOwnerParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(endorseTransferOfOwner(endorseTransferOfOwnerParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
