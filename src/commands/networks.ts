import { providers } from "ethers";

type SupportedNetwork = {
  chainId: number;
  explorer: string;
  provider: providers.Provider;
};

export enum NetworkCmdName {
  local = "local",
  mainnet = "mainnet",
  ropsten = "ropsten",
  rinkeby = "rinkeby",
  goerli = "goerli",
  polygon = "polygon",
  mumbai = "mumbai",
}

export const supportedNetwork: {
  [key in NetworkCmdName]: SupportedNetwork;
} = {
  [NetworkCmdName.local]: {
    chainId: 1337,
    explorer: "https://localhost/explorer",
    provider: new providers.JsonRpcProvider(),
  },
  [NetworkCmdName.mainnet]: {
    chainId: 1,
    explorer: "https://etherscan.io",
    provider: new providers.InfuraProvider("homestead"),
  },
  [NetworkCmdName.ropsten]: {
    chainId: 3,
    explorer: "https://ropsten.etherscan.io",
    provider: new providers.InfuraProvider("ropsten"),
  },
  [NetworkCmdName.rinkeby]: {
    chainId: 4,
    explorer: "https://rinkeby.etherscan.io",
    provider: new providers.InfuraProvider("rinkeby"),
  },
  [NetworkCmdName.goerli]: {
    chainId: 5,
    explorer: "https://goerli.etherscan.io",
    provider: new providers.InfuraProvider("goerli"),
  },
  [NetworkCmdName.polygon]: {
    chainId: 137,
    explorer: "https://polygonscan.com",
    provider: new providers.InfuraProvider("matic"),
  },
  [NetworkCmdName.mumbai]: {
    chainId: 80001,
    explorer: "https://mumbai.polygonscan.com",
    provider: new providers.InfuraProvider("maticmum"),
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[NetworkCmdName[networkCmdName as keyof typeof NetworkCmdName]];
};
