import { cancelTransaction } from "./transaction";
import { getWallet } from "../utils/wallet";
import path from "path";
import signale from "signale";
import { BigNumber } from "ethers";
jest.mock("../utils/wallet");

const mockGetWallet = getWallet as jest.Mock;

describe("document-store", () => {
  describe("cancelTransaction", () => {
    const signaleSuccessSpy = jest.spyOn(signale, "success");
    const signaleErrorSpy = jest.spyOn(signale, "error");

    it("success in canceling transaction using nonce and gas", async () => {
      const mockSendTransaction = jest.fn();
      mockSendTransaction.mockResolvedValue("success");
      mockGetWallet.mockResolvedValue({
        sendTransaction: mockSendTransaction,
        address: "0x00",
      });
      await cancelTransaction({
        nonce: "3",
        gasPrice: "300",
        network: "ropsten",
        keyFile: path.resolve(__dirname, "./key.file"),
      });
      expect(signaleSuccessSpy).toHaveBeenNthCalledWith(1, "Transaction has been cancelled");
    });

    it("success in canceling transaction using transaction hash", async () => {
      const mockGetTransaction = jest.fn();
      mockGetTransaction.mockResolvedValue({
        nonce: 3,
        gasPrice: BigNumber.from(300),
      });
      const mockSendTransaction = jest.fn();
      mockSendTransaction.mockResolvedValue("success");

      mockGetWallet.mockResolvedValue({
        sendTransaction: mockSendTransaction,
        provider: { getTransaction: mockGetTransaction },
        address: "0x00",
      });
      await cancelTransaction({
        transactionHash: "0x00",
        network: "ropsten",
        keyFile: path.resolve(__dirname, "./key.file"),
      });
      expect(signaleSuccessSpy).toHaveBeenNthCalledWith(1, "Transaction has been cancelled");
    });

    it("error in cancelling transaction due to transaction status completed", async () => {
      const mockSendTransaction = jest.fn();
      mockSendTransaction.mockRejectedValue(new Error("nonce has already been used"));
      mockGetWallet.mockResolvedValue({
        sendTransaction: mockSendTransaction,
        address: "0x00",
      });
      await cancelTransaction({
        nonce: "3",
        gasPrice: "300",
        network: "ropsten",
        keyFile: path.resolve(__dirname, "./key.file"),
      });
      expect(signaleErrorSpy).toHaveBeenNthCalledWith(1, "nonce has already been used");
    });
  });
});
