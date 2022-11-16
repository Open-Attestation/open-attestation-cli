import { ethers, utils } from "ethers";
import { green, highlight, red } from "../../utils";
import { BigNumber } from "ethers";
import { TransactionRequest } from "@ethersproject/providers";

export const dryRunMode = async ({
  transaction,
  estimatedGas,
  network,
}: {
  network: string;
  transaction?: TransactionRequest;
  estimatedGas?: BigNumber;
}): Promise<void> => {
  // estimated gas or a transaction must be provided, if a transaction is provided let's estimate the gas automatically
  // the transaction is run on the provided network
  const provider = ethers.getDefaultProvider(network);
  let _estimatedGas = estimatedGas;
  if (!estimatedGas && transaction) {
    _estimatedGas = await provider.estimateGas(transaction);
  }
  if (!_estimatedGas) {
    throw new Error("Please provide estimatedGas or transaction");
  }

  const formatGwei = (value: BigNumber): string => utils.formatUnits(value, "gwei");
  // const formatEther = (value: BigNumber): string => utils.formatUnits(value, "ether");

  const feeData = await provider.getFeeData();
  const zero = BigNumber.from(0);

  const gasPriceGwei = formatGwei(feeData.gasPrice || zero);
  const maxFeePerGasGwei = formatGwei(feeData.maxFeePerGas || zero);
  const maxPriorityFeePerGasGwei = formatGwei(feeData.maxPriorityFeePerGas || zero);

  const gasCost = (feeData.gasPrice || zero).mul(_estimatedGas);
  const maxBaseFee = (feeData.maxFeePerGas || zero).mul(_estimatedGas);
  const maxPriorityFee = (feeData.maxPriorityFeePerGas || zero).mul(_estimatedGas);
  const estimatedFee = maxBaseFee.add(maxPriorityFee);

  const gasCostGwei = formatGwei(gasCost);
  const maxBaseFeeGwei = formatGwei(maxBaseFee);
  const maxPriorityFeeGwei = formatGwei(maxPriorityFee);
  const estimatedFeeGwei = formatGwei(estimatedFee);

  console.log(
    red("\n\n/!\\ Welcome to the fee table. Please read the information below to understand the transaction fee")
  );
  console.log(
    `\nThe table below display information about the cost of the transaction on the mainnet network, depending on the gas price selected. Multiple modes are displayed to help you better help you to choose a gas price depending on your needs:\n`
  );
  console.log(green("Information about the network:"));
  console.table({
    current: {
      time: "N/A",
      "gas price (gwei)": gasPriceGwei,
      "max fee per gas (gwei)": maxFeePerGasGwei,
      "max priority fee per gas (gwei)": maxPriorityFeePerGasGwei,
    },
  });

  console.log(green("Information about the transaction:"));
  console.log(
    `Estimated gas required: ${highlight(_estimatedGas.toNumber())} gas, which will cost approximately ${highlight(
      utils.formatEther(estimatedFeeGwei)
    )} eth based on the selected gas price`
  );

  console.table({
    current: {
      time: "N/A",
      "gas cost (gwei)": gasCostGwei,
      "base fee price (gwei)": maxBaseFeeGwei,
      "priority fee price (gwei)": maxPriorityFeeGwei,
      "estimated fee (gwei)": estimatedFeeGwei,
    },
  });
  console.log(red("Please read the information above to understand the table"));
};
