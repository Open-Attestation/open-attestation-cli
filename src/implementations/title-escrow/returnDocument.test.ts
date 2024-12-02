import { TitleEscrow__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { returnDocument } from "./returnDocument";

jest.mock("@tradetrust-tt/token-registry/contracts");

const returnDocumentParams: TitleEscrowReturnDocumentCommand = {
  remark: "remark",
  encryptionKey: "encryptionKey",
  tokenRegistry: "0x1122",
  tokenId: "0x12345",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("title-escrow", () => {
  describe("return transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockedTitleEscrowFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTitleEscrowFactory: jest.Mock = mockedTitleEscrowFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockReturn = jest.fn();
    const mockCallStaticReturn = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x2133";

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockReset();
      mockedConnectERC721.mockReset();
      mockedTitleEscrowFactory.mockReset();
      mockedConnectTitleEscrowFactory.mockReset();

      mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
      mockReturn.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
      mockedConnectERC721.mockReturnValue({
        ownerOf: mockedOwnerOf,
      });
      mockedConnectTitleEscrowFactory.mockReturnValue({
        returnToIssuer: mockReturn,
        callStatic: {
          returnToIssuer: mockCallStaticReturn,
        },
      });

      mockedOwnerOf.mockClear();
      mockReturn.mockClear();
      mockCallStaticReturn.mockClear();
    });
    it("should pass in the correct params and successfully return a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await returnDocument({
        ...returnDocumentParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(returnDocumentParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(returnDocumentParams.tokenId);
      expect(mockedConnectTitleEscrowFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticReturn).toHaveBeenCalledTimes(1);
      expect(mockReturn).toHaveBeenCalledTimes(1);
    });
  });
});
