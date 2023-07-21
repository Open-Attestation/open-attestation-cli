import { cancelTransaction } from "./transaction";
import { getWalletOrSigner } from "../utils/wallet";
import path from "path";
import signale from "signale";
import { BigNumber } from "ethers/lib/ethers";
jest.mock("../utils/wallet");

const mockGetWallet = getWalletOrSigner as jest.Mock;

describe("document-store", () => {
  describe("cancelTransaction", () => {
    const signaleInfoSpy = jest.spyOn(signale, "info");

    it("success in retrieving transaction nonce and gas price using --transaction-hash", async () => {
      const mockGetTransaction = jest.fn();
      mockGetTransaction.mockResolvedValue({
        nonce: 10,
        gasPrice: BigNumber.from(3),
      });

      const mockSendTransaction = jest.fn();

      mockGetWallet.mockResolvedValue({
        provider: { getTransaction: mockGetTransaction },
        sendTransaction: mockSendTransaction,
        getAddress: () => "0xC84b0719A82626417c40f3168513dFABDB6A9079",
      });

      await cancelTransaction({
        transactionHash: "0x456bba58226f03e3fb7d72b5143ceecfb6bfb66b00586929f6d60890ec264c2c",
        network: "sepolia",
        keyFile: path.resolve(__dirname, "./key.file"),
      });
      expect(signaleInfoSpy).toHaveBeenNthCalledWith(1, "Transaction detail retrieved. Nonce: 10, Gas-price: 3");
      expect(mockSendTransaction.mock.calls[0][0].nonce.toNumber()).toEqual(10);
      expect(mockSendTransaction.mock.calls[0][0].gasPrice.toNumber()).toEqual(6);
    });
  });
});
