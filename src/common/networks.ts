import { providers } from "ethers";
import type { GasStationFunction } from "./gas-station";
import { gasStation } from "./gas-station";

export type networkCurrency = "ETH" | "MATIC" | "XDC";

type SupportedNetwork = {
  explorer: string;
  provider: () => providers.Provider;
  networkId: number;
  networkName: typeof NetworkCmdName[keyof typeof NetworkCmdName];
  currency: networkCurrency;
  gasStation?: ReturnType<GasStationFunction>;
};

export enum NetworkCmdName {
  Local = "local",
  Mainnet = "mainnet",
  Sepolia = "sepolia",
  Matic = "matic",
  Maticmum = "maticmum",
  XDC = "xdc",
  XDCApothem = "xdcapothem",
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
    networkName: NetworkCmdName.Local,
    currency: "ETH",
  },
  [NetworkCmdName.Mainnet]: {
    explorer: "https://etherscan.io",
    provider: defaultInfuraProvider("homestead"),
    networkId: 1,
    networkName: NetworkCmdName.Mainnet,
    currency: "ETH",
  },
  [NetworkCmdName.Sepolia]: {
    explorer: "https://sepolia.etherscan.io",
    provider: jsonRpcProvider("https://sepolia.infura.io/v3/bb46da3f80e040e8ab73c0a9ff365d18"),
    networkId: 11155111,
    networkName: NetworkCmdName.Sepolia,
    currency: "ETH",
  },
  [NetworkCmdName.Matic]: {
    explorer: "https://polygonscan.com",
    provider: defaultInfuraProvider("matic"),
    networkId: 137,
    networkName: NetworkCmdName.Matic,
    currency: "MATIC",
    gasStation: gasStation("https://gasstation.polygon.technology/v2"),
  },
  [NetworkCmdName.Maticmum]: {
    explorer: "https://mumbai.polygonscan.com",
    provider: defaultInfuraProvider("maticmum"),
    networkId: 80001,
    networkName: NetworkCmdName.Maticmum,
    currency: "MATIC",
    gasStation: gasStation("https://gasstation-testnet.polygon.technology/v2"),
  },
  [NetworkCmdName.XDC]: {
    explorer: "https://xdcscan.io",
    provider: jsonRpcProvider("https://erpc.xinfin.network"),
    networkId: 50,
    networkName: NetworkCmdName.XDC,
    currency: "XDC",
  },
  [NetworkCmdName.XDCApothem]: {
    explorer: "https://apothem.xdcscan.io",
    provider: jsonRpcProvider("https://erpc.apothem.network"),
    networkId: 51,
    networkName: NetworkCmdName.XDCApothem,
    currency: "XDC",
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[networkCmdName as NetworkCmdName];
};

export const getSupportedNetworkNameFromId = (networkId: number): SupportedNetwork["networkName"] => {
  const network = Object.values(supportedNetwork).find((network) => network.networkId === networkId);
  if (!network) {
    throw new Error(`Unsupported chain id ${networkId}`);
  }
  return network.networkName;
};
