import chalk from "chalk";

export const getEtherscanAddress = ({ network }: { network: string }): string =>
  `https://${network === "mainnet" ? "" : `${network}.`}etherscan.io`;

const orange = chalk.hsl(39, 100, 50);
export const highlight = orange.bold;
