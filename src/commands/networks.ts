import { providers } from "ethers";

type SupportedNetwork = {
  explorer: string;
  provider: () => providers.Provider;
  networkId: number;
  networkName: string;
};

export enum NetworkCmdName {
  Local = "local",
  Mainnet = "mainnet",
  Goerli = "goerli",
  Sepolia = "sepolia",
  Polygon = "polygon",
  Mumbai = "mumbai",
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
  },
  [NetworkCmdName.Mainnet]: {
    explorer: "https://etherscan.io",
    provider: defaultInfuraProvider("homestead"),
    networkId: 1,
    networkName: "homestead",
  },
  [NetworkCmdName.Goerli]: {
    explorer: "https://goerli.etherscan.io",
    provider: defaultInfuraProvider("goerli"),
    networkId: 5,
    networkName: "goerli",
  },
  [NetworkCmdName.Sepolia]: {
    explorer: "https://sepolia.etherscan.io",
    provider: jsonRpcProvider("https://rpc.sepolia.org"),
    networkId: 11155111,
    networkName: "sepolia",
  },
  [NetworkCmdName.Polygon]: {
    explorer: "https://polygonscan.com",
    provider: defaultInfuraProvider("matic"),
    networkId: 137,
    networkName: "matic",
  },
  [NetworkCmdName.Mumbai]: {
    explorer: "https://mumbai.polygonscan.com",
    provider: defaultInfuraProvider("maticmum"),
    networkId: 80001,
    networkName: "maticmum",
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[networkCmdName as NetworkCmdName];
};
