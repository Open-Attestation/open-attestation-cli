import { ethers, utils } from "ethers";
import fetch from "node-fetch";
import { green, highlight, red } from "../../utils";
import { BigNumber } from "ethers";
import { TransactionRequest } from "@ethersproject/providers";

export const dryRunMode = async ({
  gasPriceScale,
  transaction,
  estimatedGas,
  network,
}: {
  gasPriceScale: number;
  network: string;
  transaction?: TransactionRequest;
  estimatedGas?: BigNumber;
}): Promise<void> => {
  // estimated gas or a transaction must be provided, if a transaction is provided let's estimate the gas automatically
  // the transaction is run on the provided network
  let _estimatedGas = estimatedGas;
  if (!estimatedGas && transaction) {
    const provider = ethers.getDefaultProvider(network);
    _estimatedGas = await provider.estimateGas(transaction);
  }
  if (!_estimatedGas) {
    throw new Error("Please provide estimatedGas or transaction");
  }

  // get gas price on mainnet
  const { fast, fastest, safeLow, average } = await fetch("https://ethgasstation.info/api/ethgasAPI.json").then(
    async (response) => {
      if (response.ok) return response.json();
      else {
        throw new Error(`Unable to get gas price - ${response.statusText}`);
      }
    }
  );
  const gasPrice = await ethers.getDefaultProvider().getGasPrice();
  const gasPriceAsGwei = Number(utils.formatUnits(gasPrice, "gwei"));
  const convertGasApiToGwei = (value: number): number => Math.round(value / 10);
  const convertGweiToEthereum = (value: BigNumber): number =>
    Number(utils.formatUnits(utils.parseUnits(`${value.toNumber()}`, "gwei"), "ether"));

  console.log(red("\n\n/!\\ Welcome to the dry run mode. Please read the information below to understand the table"));
  console.log(
    `\nThe table below display information about the cost of the transaction on the mainnet network, depending on the gas price selected. Multiple modes are displayed to help you better help you to choose a gas price depending on your needs:
- ${highlight("current")} mode display information depending on the current information provided to the cli.
- ${highlight("fastest")} mode display information in order to run a transaction in less than 30s.
- ${highlight("fast")} mode display information in order to run a transaction in less than 2 mins.
- ${highlight("average")} mode display information in order to run a transaction in less than 5 mins.
- ${highlight("safe")} mode display information in order to run a transaction in less than 30 mins.
    
For each mode the following information will be shown:
- ${highlight("gas price (gwei)")}: the gas price in gwei used for the transaction.
- ${highlight(
      "tx price (gwei)"
    )}: the price of the transaction in gwei. This is the amount payed for the transaction (outside of dry-run)
- ${highlight(
      "tx price (eth)"
    )}: the price of the transaction in ethereum. This is the amount payed for the transaction (outside of dry-run). You can directly use that amount to convert it to your currency using any currency converter supporting ethereum.
- ${highlight(
      "gas price scale"
    )}: this is an estimation of the value you must set for the '--gas-price-scale' parameter. Keep in mind that two successive runs will likely produce 2 different values as the gas price is fluctuating.

Get more information about gas: https://ethereum.stackexchange.com/questions/3/what-is-meant-by-the-term-gas\n\n`
  );

  console.log(green("Information about the transaction:"));
  console.log(
    `Estimated gas required: ${highlight(
      _estimatedGas.mul(gasPriceAsGwei * gasPriceScale).toNumber()
    )} gas, which will cost approximately ${highlight(
      convertGweiToEthereum(_estimatedGas.mul(gasPriceAsGwei))
    )} eth based on the selected gas price`
  );
  console.table({
    current: {
      time: "N/A",
      "gas price (gwei)": gasPriceAsGwei * gasPriceScale,
      "tx price (gwei)": _estimatedGas.mul(gasPriceAsGwei * gasPriceScale).toNumber(),
      "tx price (eth)": convertGweiToEthereum(_estimatedGas.mul(gasPriceAsGwei * gasPriceScale)),
      "gas price scale": gasPriceScale,
    },
    fastest: {
      time: "< 30 s",
      "gas price (gwei)": convertGasApiToGwei(fastest),
      "tx price (gwei)": _estimatedGas.mul(convertGasApiToGwei(fastest)).toNumber(),
      "tx price (eth)": convertGweiToEthereum(_estimatedGas.mul(convertGasApiToGwei(fastest))),
      "gas price scale": Number((convertGasApiToGwei(fastest) / gasPriceAsGwei).toFixed(2)),
    },
    fast: {
      time: "< 2 mins",
      "gas price (gwei)": convertGasApiToGwei(fast),
      "tx price (gwei)": _estimatedGas.mul(convertGasApiToGwei(fast)).toNumber(),
      "tx price (eth)": convertGweiToEthereum(_estimatedGas.mul(convertGasApiToGwei(fast))),
      "gas price scale": Number((convertGasApiToGwei(fast) / gasPriceAsGwei).toFixed(2)),
    },
    average: {
      time: "< 5 mins",
      "gas price (gwei)": convertGasApiToGwei(average),
      "tx price (gwei)": _estimatedGas.mul(convertGasApiToGwei(average)).toNumber(),
      "tx price (eth)": convertGweiToEthereum(_estimatedGas.mul(convertGasApiToGwei(average))),
      "gas price scale": Number((convertGasApiToGwei(average) / gasPriceAsGwei).toFixed(2)),
    },
    safe: {
      time: "< 30 mins",
      "gas price (gwei)": convertGasApiToGwei(safeLow),
      "tx price (gwei)": _estimatedGas.mul(convertGasApiToGwei(safeLow)).toNumber(),
      "tx price (eth)": convertGweiToEthereum(_estimatedGas.mul(convertGasApiToGwei(safeLow))),
      "gas price scale": Number((convertGasApiToGwei(safeLow) / gasPriceAsGwei).toFixed(2)),
    },
  });
  console.log(red("Please read the information above to understand the table"));
};
