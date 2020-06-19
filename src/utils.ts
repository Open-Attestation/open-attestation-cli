export const getEtherscanAddress = ({ network }: { network: string }): string =>
  `https://${network === "mainnet" ? "" : `${network}.`}etherscan.io`;
