import signale from "signale";
import { TransactionCancelCommand } from "../../commands/transaction/transaction-command.type";
import { getWallet } from "../utils/wallet";
import { BigNumber } from "ethers";

/*
  The trick to “cancel” your pending transaction is by replacing the transaction with 
  another 0 ETH transaction with a higher gas fee sending to yourself with the same nonce as the 
  pending transaction. By having increasing the gas fee, it allow the miner to prioritize transactions 
  that pay a higher gas fee.
  (https://info.etherscan.com/how-to-cancel-ethereum-pending-transactions/)
*/
export const cancelTransaction = async ({
  network,
  key,
  keyFile,
  encryptedWalletPath,
  nonce,
  gasPrice,
  transactionHash,
}: TransactionCancelCommand): Promise<void> => {
  try {
    const wallet = await getWallet({ key, keyFile, network, encryptedWalletPath });

    if (transactionHash) {
      const currentTransaction = await wallet.provider.getTransaction(transactionHash);
      nonce = currentTransaction.nonce.toString();
      gasPrice = currentTransaction.gasPrice.mul(2).toString();
    }

    if (nonce && gasPrice) {
      await wallet.sendTransaction({
        to: wallet.address,
        from: wallet.address,
        nonce: BigNumber.from(parseFloat(nonce)),
        gasPrice: BigNumber.from(parseFloat(gasPrice)),
      });
      signale.success(`Transaction has been cancelled`);
    } else {
      signale.error(`Please indicate the transaction hash or the pending transaction's nonce and gas price`);
    }
  } catch (e) {
    signale.error(e.message);
  }
};
