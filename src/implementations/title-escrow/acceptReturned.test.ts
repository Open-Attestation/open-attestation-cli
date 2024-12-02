import { TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowReturnDocumentCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { acceptReturned } from "./acceptReturned";

jest.mock("@tradetrust-tt/token-registry/contracts");

const acceptReturnedDocumentParams: TitleEscrowReturnDocumentCommand = {
  tokenRegistry: "0x1122",
  tokenId: "0x12345",
  remark: "remark",
  encryptionKey: "encryptionKey",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("title-escrow", () => {
  describe("accepts returned transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;
    const mockBurnToken = jest.fn();
    const mockCallStaticBurnToken = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockReset();
      mockedConnectERC721.mockReset();

      mockBurnToken.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });

      mockedConnectERC721.mockReturnValue({
        burn: mockBurnToken,
        callStatic: {
          burn: mockCallStaticBurnToken,
        },
      });
      mockBurnToken.mockClear();
      mockCallStaticBurnToken.mockClear();
    });
    it("should pass in the correct params and successfully accepts a returned transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await acceptReturned({
        ...acceptReturnedDocumentParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(acceptReturnedDocumentParams.tokenRegistry, passedSigner);
      expect(mockCallStaticBurnToken).toHaveBeenCalledTimes(1);
      expect(mockBurnToken).toHaveBeenCalledTimes(1);
    });
  });
});
