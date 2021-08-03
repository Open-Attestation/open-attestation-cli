import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { join } from "path";
import { TitleEscrowNominateChangeOfOwnerCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { nominateChangeOfOwner } from "./nominateChangeOfOwner";

jest.mock("@govtechsg/token-registry");

const nominateChangeOfOwnerParams: TitleEscrowNominateChangeOfOwnerCommand = {
  newOwner: "0fosui",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "ropsten",
  gasPriceScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of TradeTrustErc721Factory
// ideally must setup ganache, and run the function over it
describe("title-escrow", () => {
  describe("nominate change of owner of transferable record", () => {
    const mockedTradeTrustErc721Factory: jest.Mock<TradeTrustErc721Factory> = TradeTrustErc721Factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustErc721Factory.connect;
    const mockedTokenFactory: jest.Mock<TitleEscrowFactory> = TitleEscrowFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockApproveNewTransferTargets = jest.fn();
    const mockedTitleEscrowAddress = "0x2133";
    const mockedBeneficiary = "0xdssfs";
    const mockedHolder = "0xdsfls";
    const mockGetBeneficiary = jest.fn();
    const mockGetHolder = jest.fn();
    mockGetBeneficiary.mockResolvedValue(mockedBeneficiary);
    mockGetHolder.mockResolvedValue(mockedHolder);
    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      approveNewTransferTargets: mockApproveNewTransferTargets,
      beneficiary: mockGetBeneficiary,
      holder: mockGetHolder,
    });
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockApproveNewTransferTargets.mockReturnValue({
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
      mockApproveNewTransferTargets.mockClear();
      mockGetBeneficiary.mockClear();
      mockGetHolder.mockClear();
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await nominateChangeOfOwner(nominateChangeOfOwnerParams);

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await nominateChangeOfOwner({
        ...nominateChangeOfOwnerParams,
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and call the following procedures to invoke an nomination of change of owner of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await nominateChangeOfOwner({
        ...nominateChangeOfOwnerParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(nominateChangeOfOwnerParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(nominateChangeOfOwnerParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockGetHolder).toHaveBeenCalledTimes(1);
      expect(mockGetBeneficiary).toHaveBeenCalledTimes(1);
      expect(mockApproveNewTransferTargets).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if new owner addresses is the same as current owner", async () => {
      mockGetBeneficiary.mockReturnValue(nominateChangeOfOwnerParams.newOwner);
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await expect(
        nominateChangeOfOwner({
          ...nominateChangeOfOwnerParams,
          key: privateKey,
        })
      ).rejects.toThrow("new owner address is the same as the current owner address");
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedConnectERC721.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(nominateChangeOfOwner(nominateChangeOfOwnerParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(nominateChangeOfOwner(nominateChangeOfOwnerParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
