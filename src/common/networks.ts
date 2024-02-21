import { providers } from "ethers";
import type { GasStationFunction } from "./gas-station";
import { gasStation } from "./gas-station";

export type networkCurrency = "ETH" | "MATIC" | "XDC" | "HBAR" | "FREE";

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
  HederaMainnet = "hederamainnet",
  HederaTestnet = "hederatestnet",
  StabilityTestnet = "stabilitytestnet",
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
  [NetworkCmdName.HederaMainnet]: {
    explorer: "https://hashscan.io/mainnet",
    provider: jsonRpcProvider("https://mainnet.hashio.io/api"),
    networkId: 295,
    networkName: NetworkCmdName.HederaMainnet,
    currency: "HBAR",
  },
  [NetworkCmdName.HederaTestnet]: {
    explorer: "https://hashscan.io/testnet",
    provider: jsonRpcProvider("https://testnet.hashio.io/api"),
    networkId: 296,
    networkName: NetworkCmdName.HederaTestnet,
    currency: "HBAR",
  },
  [NetworkCmdName.StabilityTestnet]: {
    explorer: "https://stability-testnet.blockscout.com/",
    provider: jsonRpcProvider("https://free.testnet.stabilityprotocol.com"),
    networkId: 20180427,
    networkName: NetworkCmdName.StabilityTestnet,
    currency: "FREE",
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
