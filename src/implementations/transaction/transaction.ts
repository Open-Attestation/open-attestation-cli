import { Transaction } from "@ethersproject/transactions";
import signale from "signale";
import { TransactionCancelCommand } from "../../commands/transaction/transaction-command.type";
import { getWallet } from "../utils/wallet";

export const cancelTransaction = async ({
  network,
  key,
  keyFile,
  encryptedWalletPath,
  nonce,
  gas,
}: TransactionCancelCommand): Promise<void> => {
  const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });
  //   to?: string;
  //   from?: string;
  //   nonce?: BigNumberish;
  //   gasLimit?: BigNumberish;
  //   gasPrice?: BigNumberish;
  //   data?: BytesLike;
  //   value?: BigNumberish;
  //   chainId?: number;
  console.log(wallet.address);
  const transaction = wallet.sendTransaction({
    to: wallet.address,
    from: wallet.address,
    nonce: nonce,
    gasPrice: gas,
  });
  console.log(transaction);
};
