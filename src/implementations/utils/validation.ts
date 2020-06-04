import { isAddress } from "web3-utils";

export const validateAddress = (address: string): void => {
  if (!isAddress(address)) throw new Error(`${address} is not a valid Ethereum address`);
};
