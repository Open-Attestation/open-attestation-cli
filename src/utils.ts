import chalk from "chalk";
import { ErrorCode } from "@ethersproject/logger";
import { ethers } from "ethers";
import { Logger } from "ethers/lib/utils";

export const getEtherscanAddress = ({ network }: { network: string }): string =>
  `https://${network === "mainnet" ? "" : `${network}.`}etherscan.io`;

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

export const extractErrorMessage = (error: unknown): string => toErrorWithMessage(error).message;

export interface ErrorHandlerFunction {
  (error: any): string;
}

// const genericErrors: ErrorCode[] = [
//   Logger.errors.UNKNOWN_ERROR,
//   Logger.errors.NOT_IMPLEMENTED,
//   Logger.errors.UNSUPPORTED_OPERATION,
//   Logger.errors.NETWORK_ERROR,
//   Logger.errors.SERVER_ERROR,
//   Logger.errors.TIMEOUT,
// ];
// const operationalErrors: ErrorCode[] = [Logger.errors.BUFFER_OVERRUN, Logger.errors.NUMERIC_FAULT];
// const argumentsErrors: ErrorCode[] = [
//   Logger.errors.MISSING_NEW,
//   Logger.errors.INVALID_ARGUMENT,
//   Logger.errors.MISSING_ARGUMENT,
//   Logger.errors.UNEXPECTED_ARGUMENT,
// ];

const blockchainErrors: ErrorCode[] = [
  Logger.errors.CALL_EXCEPTION,
  Logger.errors.INSUFFICIENT_FUNDS,
  Logger.errors.NONCE_EXPIRED,
  Logger.errors.REPLACEMENT_UNDERPRICED,
  Logger.errors.UNPREDICTABLE_GAS_LIMIT,
  Logger.errors.TRANSACTION_REPLACED,
];

export const getErrorMessage = async function (error: unknown, network?: string): Promise<string> {
  // console.log(error)
  if (error instanceof Error) {
    let errorMessage: string = "reason" in error ? error["reason"] : error.message;

    if ("code" in error) {
      if (blockchainErrors.includes(error["code"])) {
        try {
          errorMessage = await retrieveBlockchainError(error, network);
        } catch (e) {}
      }
    }
    return Promise.resolve(errorMessage);
  } else {
    // console.log("not instanceof")
    return Promise.resolve(extractErrorMessage(error));
  }
};

const retrieveBlockchainError = async function (error: any, network?: string): Promise<string> {
  const errorProperties: string[] = Object.getOwnPropertyNames(error);
  if (!errorProperties.includes("tx") || network === undefined) {
    throw new Error("No transaction information found.");
  }
  const txParams = {
    to: error.tx.to,
    data: error.tx.data,
    blockTag: "latest",
  };
  let reason = error.message;
  const provider = ethers.getDefaultProvider(network);
  try {
    const code = await provider.call(txParams);
    reason = hex_to_ascii(code.substr(138));
  } catch (e) {}

  return reason;
};

function hex_to_ascii(str1: string): string {
  const hex = str1.toString();
  let str = "";
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
