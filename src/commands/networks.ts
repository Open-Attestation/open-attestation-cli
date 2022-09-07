import { providers } from "ethers";

type SupportedNetwork = {
  chainId: number;
  explorer: string;
  provider: () => providers.Provider;
};

enum NetworkCmdName {
  Local = "local",
  Mainnet = "mainnet",
  Ropsten = "ropsten",
  Rinkeby = "rinkeby",
  Goerli = "goerli",
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
    chainId: 1337,
    explorer: "https://localhost/explorer",
    provider: jsonRpcProvider("http://127.0.0.1:8545"),
  },
  [NetworkCmdName.Mainnet]: {
    chainId: 1,
    explorer: "https://etherscan.io",
    provider: defaultInfuraProvider("homestead"),
  },
  [NetworkCmdName.Ropsten]: {
    chainId: 3,
    explorer: "https://ropsten.etherscan.io",
    provider: defaultInfuraProvider("ropsten"),
  },
  [NetworkCmdName.Rinkeby]: {
    chainId: 4,
    explorer: "https://rinkeby.etherscan.io",
    provider: defaultInfuraProvider("rinkeby"),
  },
  [NetworkCmdName.Goerli]: {
    chainId: 5,
    explorer: "https://goerli.etherscan.io",
    provider: defaultInfuraProvider("goerli"),
  },
  [NetworkCmdName.Polygon]: {
    chainId: 137,
    explorer: "https://polygonscan.com",
    provider: defaultInfuraProvider("matic"),
  },
  [NetworkCmdName.Mumbai]: {
    chainId: 80001,
    explorer: "https://mumbai.polygonscan.com",
    provider: defaultInfuraProvider("maticmum"),
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[networkCmdName as NetworkCmdName];
};
