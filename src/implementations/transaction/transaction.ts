import signale from "signale";
import { TransactionCancelCommand } from "../../commands/transaction/transaction-command.type";
import { getWallet } from "../utils/wallet";
import { BigNumber } from "ethers";

export const cancelTransaction = async ({
  network,
  key,
  keyFile,
  encryptedWalletPath,
  nonce,
  gas,
}: TransactionCancelCommand): Promise<void> => {
  try {
    const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
    await wallet.sendTransaction({
      to: wallet.address,
      from: wallet.address,
      nonce: BigNumber.from(parseFloat(nonce)),
      gasPrice: BigNumber.from(parseFloat(gas)),
    });
    signale.success(`Transaction has been cancelled`);
  } catch (e) {
    signale.error(e.message);
  }
};
