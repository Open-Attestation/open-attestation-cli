import chalk from "chalk";

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

export const getErrorMessage = function (error: unknown): string {
  if (error instanceof Error) {
    return "reason" in error ? error["reason"] : error.message;
  } else {
    return extractErrorMessage(error);
  }
};