import { constants, utils } from "ethers";
import { getSpotRate, green, highlight, red } from "../../utils";
import { BigNumber } from "ethers";
import { TransactionRequest } from "@ethersproject/providers";
import { convertWeiFiatDollars } from "../../utils";
import { getSupportedNetwork } from "../../commands/networks";

export interface FeeDataType {
  maxFeePerGas: BigNumber | null;
  maxPriorityFeePerGas: BigNumber | null;
}

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
  console.log("Dry Run is currently disabled.");
};
