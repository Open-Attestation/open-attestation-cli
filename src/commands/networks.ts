import { providers } from "ethers";

type SupportedNetwork = {
  explorer: string;
  provider: () => providers.Provider;
};

enum NetworkCmdName {
  Local = "local",
  Mainnet = "mainnet",
  Ropsten = "ropsten",
  Rinkeby = "rinkeby",
  Goerli = "goerli",
  Sepolia = "sepolia",
  Polygon = "polygon",
  Mumbai = "mumbai",
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
  },
  [NetworkCmdName.Mainnet]: {
    explorer: "https://etherscan.io",
    provider: defaultInfuraProvider("homestead"),
  },
  [NetworkCmdName.Ropsten]: {
    explorer: "https://ropsten.etherscan.io",
    provider: defaultInfuraProvider("ropsten"),
  },
  [NetworkCmdName.Rinkeby]: {
    explorer: "https://rinkeby.etherscan.io",
    provider: defaultInfuraProvider("rinkeby"),
  },
  [NetworkCmdName.Goerli]: {
    explorer: "https://goerli.etherscan.io",
    provider: defaultInfuraProvider("goerli"),
  },
  [NetworkCmdName.Sepolia]: {
    explorer: "https://sepolia.etherscan.io",
    provider: jsonRpcProvider("https://rpc.sepolia.org"),
  },
  [NetworkCmdName.Polygon]: {
    explorer: "https://polygonscan.com",
    provider: defaultInfuraProvider("matic"),
  },
  [NetworkCmdName.Mumbai]: {
    explorer: "https://mumbai.polygonscan.com",
    provider: defaultInfuraProvider("maticmum"),
  },
  [NetworkCmdName.XDC]: {
    explorer: "https://xdcscan.io",
    provider: jsonRpcProvider("https://erpc.xinfin.network"),
  },
  [NetworkCmdName.XDCApothem]: {
    explorer: "https://apothem.xdcscan.io",
    provider: jsonRpcProvider("https://erpc.apothem.network"),
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[networkCmdName as NetworkCmdName];
};
