import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { join } from "path";
import { TitleEscrowEndorseChangeOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { endorseChangeOfOwner } from "./endorseChangeOfOwner";

jest.mock("@govtechsg/token-registry");

const endorseChangeOwnerParams: TitleEscrowEndorseChangeOfOwnerCommand = {
  newHolder: "0xabcd",
  newOwner: "0fosui",
  tokenId: "0xzyxw",
  address: "0x1234",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustErc721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("endorse change of owner of transferable record", () => {
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
      transferToNewEscrow: mockTransferToNewEscrow,
      beneficiary: mockGetBeneficiary,
      holder: mockGetHolder,
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
      mockGetBeneficiary.mockClear();
      mockGetHolder.mockClear();
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await endorseChangeOfOwner(endorseChangeOwnerParams);

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await endorseChangeOfOwner({
        ...endorseChangeOwnerParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and call the following procedures to invoke an endorsement of change of owner of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await endorseChangeOfOwner({
        ...endorseChangeOwnerParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(endorseChangeOwnerParams.address, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(endorseChangeOwnerParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockGetBeneficiary).toHaveBeenCalledTimes(1);
      expect(mockGetHolder).toHaveBeenCalledTimes(1);
      expect(mockTransferToNewEscrow).toHaveBeenCalledTimes(1);
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

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(endorseChangeOfOwner(endorseChangeOwnerParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(endorseChangeOfOwner(endorseChangeOwnerParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
