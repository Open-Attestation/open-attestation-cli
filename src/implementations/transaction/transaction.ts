import signale from "signale";
import { TransactionCancelCommand } from "../../commands/transaction/transaction-command.type";
import { getWalletOrSigner } from "../utils/wallet";
import { BigNumber } from "ethers";
import { getErrorMessage } from "../../utils";

/*
  The trick to “cancel” your pending transaction is by replacing the transaction with
  another 0 ETH transaction with a higher gas fee sending to yourself with the same nonce as the
  pending transaction. By having increasing the gas fee, it allow the miner to prioritize transactions
  that pay a higher gas fee.
  (https://info.etherscan.com/how-to-cancel-ethereum-pending-transactions/)
*/
export const cancelTransaction = async ({
  network,
  nonce,
  gasPrice,
  transactionHash,
  ...rest
}: TransactionCancelCommand): Promise<void> => {
  try {
    const wallet = await getWalletOrSigner({ network, ...rest });
    let transactionNonce = nonce;
    let transactionGasPrice = gasPrice;

    if (transactionHash) {
      const currentTransaction = await wallet.provider.getTransaction(transactionHash);
      signale.info(
        `Transaction detail retrieved. Nonce: ${currentTransaction.nonce}, Gas-price: ${currentTransaction.gasPrice}`
      );
      transactionNonce = currentTransaction.nonce.toString();
      transactionGasPrice = currentTransaction.gasPrice?.mul(2).toString();
    }

    if (transactionNonce && transactionGasPrice) {
      await wallet.sendTransaction({
        to: wallet.getAddress(),
        from: wallet.getAddress(),
        nonce: BigNumber.from(parseFloat(transactionNonce)),
        gasPrice: BigNumber.from(parseFloat(transactionGasPrice)),
      });
      signale.success(`Transaction has been cancelled`);
    } else {
      signale.error(`Please indicate the transaction hash or the pending transaction's nonce and gas price`);
    }
  } catch (e) {
    signale.error(await getErrorMessage(e,network));
  }
};
