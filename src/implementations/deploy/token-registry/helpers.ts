import { ethers } from "ethers";
import { constants } from "@govtechsg/token-registry";

export interface DeployContractAddress {
  titleEscrowFactory: string;
  tokenImplementation: string;
  deployer: string;
}

export interface Params {
  name: string;
  symbol: string;
  deployer: string;
}

export const encodeInitParams = ({ name, symbol, deployer }: Params): string => {
  return ethers.utils.defaultAbiCoder.encode(["string", "string", "address"], [name, symbol, deployer]);
};

export const retrieveFactoryAddress = (chainId: number, factoryAddress: string | undefined): DeployContractAddress => {
  const { contractAddress } = constants;

  if (!chainId) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  let titleEscrowFactory = factoryAddress;
  const tokenImplementation = contractAddress.TokenImplementation[chainId];
  const deployer = contractAddress.Deployer[chainId];

  if (!tokenImplementation || !deployer) {
    throw new Error(`ChainId ${chainId} currently is not supported. Use token-registry to deploy.`);
  }

  if (!titleEscrowFactory) {
    titleEscrowFactory = contractAddress.TitleEscrowFactory[chainId];
    if (!titleEscrowFactory) {
      throw new Error(`ChainId ${chainId} currently is not supported. Supply a factory address.`);
    }
  }

  return {
    titleEscrowFactory: titleEscrowFactory,
    tokenImplementation: tokenImplementation,
    deployer: deployer,
  } as DeployContractAddress;
};
