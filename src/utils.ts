import chalk from "chalk";
import { NetworkCmdName, getSupportedNetwork, getSupportedNetworkNameFromId } from "./common/networks";
import { info } from "signale";
import { BigNumber, Overrides, constants, utils, ethers } from "ethers";
import fetch, { RequestInit } from "node-fetch";
import { Provider } from "@ethersproject/abstract-provider";
import { GasPriceScale } from "./commands/shared";
import type { GasStationFeeData } from "./common/gas-station";

export const getEtherscanAddress = ({ network }: { network: string }): string => getSupportedNetwork(network).explorer;

export const addAddressPrefix = (address: string): string => (address.startsWith("0x") ? address : `0x${address}`);

const orange = chalk.hsl(39, 100, 50);
export const highlight = orange.bold;
export const red = chalk.hsl(360, 100, 50).bold;
export const green = chalk.hsl(123, 100, 50).bold;

type ErrorWithMessage = {
  message: string;
};

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof (error as Record<string, unknown>).message === "string";

const toErrorWithMessage = function (maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
};

// TransactionReceipt
export interface TransactionReceiptFees {
  effectiveGasPrice: BigNumber;
  gasUsed: BigNumber;
}

export const scaleBigNumber = (wei: BigNumber | null | undefined, multiplier: number, precision = 2): BigNumber => {
  if (wei === null || typeof wei === "undefined") {
    throw new Error("Wei not specified");
  }
  const padding = Math.pow(10, precision);
  const newMultiplier = Math.round(padding * multiplier);

  const newWei = wei.mul(newMultiplier).div(padding);
  return newWei;
};

interface GetGasFeesArgs extends GasPriceScale {
  provider: Provider;
  network: string;
}

export const getGasFees = async ({
  provider,
  maxPriorityFeePerGasScale,
  network,
}: GetGasFeesArgs): Promise<Overrides> => {
  const feeData = await getFeeData(provider);
  const { maxFeePerGas, maxPriorityFeePerGas } = feeData;
  if (network === NetworkCmdName.StabilityTestnet) {
    return {
      maxFeePerGas: 0,
      maxPriorityFeePerGas: 0,
    };
  }
  return {
    maxPriorityFeePerGas: scaleBigNumber(maxPriorityFeePerGas, maxPriorityFeePerGasScale),
    maxFeePerGas: calculateMaxFee(maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasScale),
  };
};

export const getFeeData = async (provider: ethers.providers.Provider): Promise<GasStationFeeData> => {
  const networkName = getSupportedNetworkNameFromId((await provider.getNetwork()).chainId);
  const gasStation = getSupportedNetwork(networkName)?.gasStation;

  const feeData = gasStation && (await gasStation());

  return feeData || (await provider.getFeeData());
};

export const calculateMaxFee = (
  maxFee: BigNumber | null | undefined,
  priorityFee: BigNumber | null | undefined,
  scale: number
): BigNumber => {
  if (maxFee === null || typeof maxFee === "undefined") {
    throw new Error("Max Fee not specified");
  }
  if (priorityFee === null || typeof priorityFee === "undefined") {
    throw new Error("Priority Fee not specified");
  }
  if (scale === 1) {
    return maxFee;
  }

  const priorityFeeChange = scaleBigNumber(priorityFee, scale).sub(priorityFee);
  return maxFee.add(priorityFeeChange);
};

export const displayTransactionPrice = async (transaction: TransactionReceiptFees): Promise<void> => {
  const totalWEI = transaction.effectiveGasPrice.mul(transaction.gasUsed);
  const spotRateETH = await getSpotRate("ETH", "USD");
  const totalETHUSD = convertWeiFiatDollars(totalWEI, spotRateETH);
  const spotRateMATIC = await getSpotRate("MATIC", "USD");
  const totalMATICUSD = convertWeiFiatDollars(totalWEI, spotRateMATIC);
  info(
    `Transaction fee of ${utils.formatEther(totalWEI)} eth / ~ ETH-USD ${totalETHUSD} or MATIC-USD ${totalMATICUSD}`
  );
};

export const request = (url: string, options?: RequestInit): Promise<any> => {
  return fetch(url, options)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`unexpected response ${response.statusText}`);
      }
      return response;
    })
    .then((response) => response.json());
};

export const getSpotRate = async (crypto_currency = "ETH", fiat_currency = "USD"): Promise<number> => {
  const spotRate = (await request(`https://api.coinbase.com/v2/prices/${crypto_currency}-${fiat_currency}/spot`)).data
    .amount;
  return spotRate;
};

// Minimally precision of 2 to get precision of 1 cent
export const convertWeiFiatDollars = (cost: BigNumber, spotRate: number, precision = 5): number => {
  const padding = Math.pow(10, precision);
  const spotRateCents = Math.ceil(spotRate * padding); // Higher better than lower
  const costInWeiFiatCents = cost.mul(BigNumber.from(spotRateCents));
  const costInFiatDollars = costInWeiFiatCents.div(constants.WeiPerEther).div(padding).toNumber(); // Fiat Dollar
  const costInFiatCents = (costInWeiFiatCents.div(constants.WeiPerEther).toNumber() % padding) / padding; /// Fiat Cents
  return costInFiatDollars + costInFiatCents;
};

export const extractErrorMessage = (error: unknown): string => toErrorWithMessage(error).message;

export const getErrorMessage = function (error: unknown): string {
  if (error instanceof Error) {
    return "reason" in error ? error["reason"] : error.message;
  } else {
    return extractErrorMessage(error);
  }
};
