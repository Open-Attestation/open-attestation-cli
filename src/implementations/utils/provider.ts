import { providers } from "ethers";

export const getInfuraKey = (): string => {
  return process.env["INFURA_KEY"] || "a5540bf020ed47318a0970c943cc2a4e";
};

export const getProvider = (network: string): providers.Provider => {
  const provider = new providers.InfuraProvider(network, getInfuraKey());
  // added fallback in the case Infura doesn't work
  return provider || providers.getDefaultProvider(network);
};
