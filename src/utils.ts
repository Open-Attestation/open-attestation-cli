import chalk from "chalk";
import { getSupportedNetwork } from "./commands/networks";
import { info } from "signale";
import { BigNumber, constants, utils } from "ethers";
import fetch, { RequestInit } from "node-fetch";

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
  const spotRate = await getSpotRate();
  const totalSGD = convertWEISGD(totalWEI, spotRate);
  info(`Transaction fee of ${utils.formatEther(totalWEI)} eth / ~S$ ${totalSGD}`);
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

export const getSpotRate = async (): Promise<number> => {
  const spotRate = (await request("https://api.coinbase.com/v2/prices/ETH-SGD/spot")).data.amount;
  return spotRate;
};

export const convertWEISGD = (cost: BigNumber, spotRate: number): number => {
  const cents = 100;
  const spotRateCents = Math.ceil(spotRate * cents); // Higher better than lower
  const costInWeiSGC = cost.mul(BigNumber.from(spotRateCents));
  const costInSGD = costInWeiSGC.div(constants.WeiPerEther).div(cents).toNumber(); // Singapore Dollar
  const costInSGC = (costInWeiSGC.mul(cents).div(constants.WeiPerEther).toNumber() % cents) / cents; // Singapore Cents
  return costInSGD + costInSGC;
};

export const extractErrorMessage = (error: unknown): string => toErrorWithMessage(error).message;

export const getErrorMessage = function (error: unknown): string {
  if (error instanceof Error) {
    return "reason" in error ? error["reason"] : error.message;
  } else {
    return extractErrorMessage(error);
  }
};
