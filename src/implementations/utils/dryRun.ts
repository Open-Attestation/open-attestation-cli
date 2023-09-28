import { constants, utils } from "ethers";
import { getSpotRate, green, highlight, red } from "../../utils";
import { BigNumber } from "ethers";
import { TransactionRequest } from "@ethersproject/providers";
import { convertWeiFiatDollars } from "../../utils";
import { getSupportedNetwork } from "../../commands/networks";

export interface FeeDataType {
  gasPrice: BigNumber | null;
}

const convertToGwei = (value: BigNumber): number => {
  return Math.round(Number(utils.formatUnits(value, "gwei")));
};

const convertToEther = (value: BigNumber, fixedCount: number): string => {
  return Number.parseFloat(Number.parseFloat(utils.formatEther(value)).toFixed(fixedCount)).toLocaleString();
};

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
  const provider = getSupportedNetwork(network).provider();
  let _estimatedGas = estimatedGas;
  if (!estimatedGas && transaction) {
    _estimatedGas = await provider.estimateGas(transaction);
  }
  if (!_estimatedGas) {
    throw new Error("Please provide estimatedGas or transaction");
  }

  const blockNumber = await provider.getBlockNumber();
  const feeData = await provider.getFeeData();
  const zero = constants.Zero;
  const { gasPrice } = {
    gasPrice: BigNumber.from(feeData.gasPrice) || zero,
  };

  const gasCost = gasPrice.mul(_estimatedGas);

  const spotRateETHUSD = await getSpotRate("ETH", "USD");
  const spotRateETHSGD = await getSpotRate("ETH", "SGD");
  const spotRateMATICUSD = await getSpotRate("MATIC", "USD");
  const spotRateMATICSGD = await getSpotRate("MATIC", "SGD");

  console.log(
    red("\n\n/!\\ Welcome to the fee table. Please read the information below to understand the transaction fee")
  );
  console.log(
    `\nThe table below display information about the cost of the transaction on the network, depending on the gas price selected. Multiple networks are displayed to help you better help you to choose a network depending on your needs:\n`
  );

  console.log(green("Information about the network:"));
  console.log(`Costs based on block number: ${highlight(blockNumber.toLocaleString())}`);
  console.table({
    current: {
      "block number": blockNumber.toLocaleString(),
      "gas price (gwei)": convertToGwei(gasPrice).toLocaleString(),
    },
  });

  console.log(green("Information about the transaction:"));

  console.log(`Estimated gas required: ${highlight(_estimatedGas.toNumber().toLocaleString())} gas`);

  console.table({
    GWEI: {
      "gas cost": convertToGwei(gasCost).toLocaleString(),
    },
    ETH: {
      "gas cost": convertToEther(gasCost, 4),
    },
    ETHUSD: {
      "gas cost": convertWeiFiatDollars(gasCost, spotRateETHUSD).toLocaleString(),
    },
    ETHSGD: {
      "gas cost": convertWeiFiatDollars(gasCost, spotRateETHSGD).toLocaleString(),
    },
    MATICUSD: {
      "gas cost": convertWeiFiatDollars(gasCost, spotRateMATICUSD).toLocaleString(),
    },
    MATICSGD: {
      "gas cost": convertWeiFiatDollars(gasCost, spotRateMATICSGD).toLocaleString(),
    },
  });
  console.log(red("Please read the information above to understand the table"));
};
