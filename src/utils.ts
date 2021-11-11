import chalk from "chalk";

export const getEtherscanAddress = ({ network }: { network: string }): string =>
  `https://${network === "mainnet" ? "" : `${network}.`}etherscan.io`;

export const validateAddressPrefix = (address: string): string => (address.startsWith("0x") ? address : `0x${address}`);

const orange = chalk.hsl(39, 100, 50);
export const highlight = orange.bold;
export const red = chalk.hsl(360, 100, 50).bold;
export const green = chalk.hsl(123, 100, 50).bold;
