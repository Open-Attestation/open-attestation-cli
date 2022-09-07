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

export const supportedNetwork: {
  [key in NetworkCmdName]: SupportedNetwork;
} = {
  [NetworkCmdName.Local]: {
    chainId: 1337,
    explorer: "https://localhost/explorer",
    provider: () => new providers.JsonRpcProvider("http://127.0.0.1:8545"),
  },
  [NetworkCmdName.Mainnet]: {
    chainId: 1,
    explorer: "https://etherscan.io",
    provider: () => new providers.InfuraProvider("homestead"),
  },
  [NetworkCmdName.Ropsten]: {
    chainId: 3,
    explorer: "https://ropsten.etherscan.io",
    provider: () => new providers.InfuraProvider("ropsten"),
  },
  [NetworkCmdName.Rinkeby]: {
    chainId: 4,
    explorer: "https://rinkeby.etherscan.io",
    provider: () => new providers.InfuraProvider("rinkeby"),
  },
  [NetworkCmdName.Goerli]: {
    chainId: 5,
    explorer: "https://goerli.etherscan.io",
    provider: () => new providers.InfuraProvider("goerli"),
  },
  [NetworkCmdName.Polygon]: {
    chainId: 137,
    explorer: "https://polygonscan.com",
    provider: () => new providers.InfuraProvider("matic"),
  },
  [NetworkCmdName.Mumbai]: {
    chainId: 80001,
    explorer: "https://mumbai.polygonscan.com",
    provider: () => new providers.InfuraProvider("maticmum"),
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[networkCmdName as NetworkCmdName];
};
