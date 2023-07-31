import { providers } from "ethers";

export type networkCurrency = "ETH" | "MATIC" | "XDC";

type SupportedNetwork = {
  explorer: string;
  provider: () => providers.Provider;
  networkId: number;
  networkName: string;
  currency: networkCurrency;
};

export enum NetworkCmdName {
  Local = "local",
  Mainnet = "mainnet",
  Goerli = "goerli",
  Sepolia = "sepolia",
  Matic = "matic",
  Maticmum = "maticmum",
  XDC = "xdc",
  Apothem = "xdcapothem",
}

const defaultInfuraProvider =
  (networkName: string): (() => providers.Provider) =>
  () =>
    new providers.InfuraProvider(networkName);

const jsonRpcProvider =
  (url: string): (() => providers.Provider) =>
  () =>
    new providers.JsonRpcProvider(url);

export const supportedNetwork: {
  [key in NetworkCmdName]: SupportedNetwork;
} = {
  [NetworkCmdName.Local]: {
    explorer: "https://localhost/explorer",
    provider: jsonRpcProvider("http://127.0.0.1:8545"),
    networkId: 1337,
    networkName: "local",
    currency: "ETH",
  },
  [NetworkCmdName.Mainnet]: {
    explorer: "https://etherscan.io",
    provider: defaultInfuraProvider("homestead"),
    networkId: 1,
    networkName: "homestead",
    currency: "ETH",
  },
  [NetworkCmdName.Goerli]: {
    explorer: "https://goerli.etherscan.io",
    provider: defaultInfuraProvider("goerli"),
    networkId: 5,
    networkName: "goerli",
    currency: "ETH",
  },
  [NetworkCmdName.Sepolia]: {
    explorer: "https://sepolia.etherscan.io",
    provider: jsonRpcProvider("https://sepolia.infura.io/v3/bb46da3f80e040e8ab73c0a9ff365d18"),
    networkId: 11155111,
    networkName: "sepolia",
    currency: "ETH",
  },
  [NetworkCmdName.Matic]: {
    explorer: "https://polygonscan.com",
    provider: defaultInfuraProvider("matic"),
    networkId: 137,
    networkName: "matic",
    currency: "MATIC",
  },
  [NetworkCmdName.Maticmum]: {
    explorer: "https://mumbai.polygonscan.com",
    provider: defaultInfuraProvider("maticmum"),
    networkId: 80001,
    networkName: "maticmum",
    currency: "MATIC",
  },
  [NetworkCmdName.XDC]: {
    explorer: "https://xdcscan.io",
    provider: jsonRpcProvider("https://erpc.xinfin.network"),
    networkId: 50,
    networkName: "xdc",
    currency: "XDC",
  },
  [NetworkCmdName.Apothem]: {
    explorer: "https://apothem.xdcscan.io",
    provider: jsonRpcProvider("https://erpc.apothem.network"),
    networkId: 51,
    networkName: "xdcapothem",
    currency: "XDC",
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[networkCmdName as NetworkCmdName];
};
