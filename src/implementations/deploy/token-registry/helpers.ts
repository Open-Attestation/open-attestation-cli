import { ethers } from "ethers";
import { constants } from "@govtechsg/token-registry";
import { isAddress } from "ethers/lib/utils";

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

export const retrieveFactoryAddress = (
  chainId: number,
  inputAddress?: DeployContractAddress
): DeployContractAddress => {
  const { contractAddress } = constants;

  if (!chainId) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  const titleEscrowFactory = inputAddress?.titleEscrowFactory || contractAddress.TitleEscrowFactory[chainId] || "";
  const tokenImplementation = inputAddress?.tokenImplementation || contractAddress.TokenImplementation[chainId] || "";
  const deployer = inputAddress?.deployer || contractAddress.Deployer[chainId] || "";

  if (!isAddress(tokenImplementation) || !isAddress(deployer)) {
    throw new Error(`ChainId ${chainId} currently is not supported. Use token-registry to deploy.`);
  }

  if (!isAddress(titleEscrowFactory)) {
    throw new Error(`ChainId ${chainId} currently is not supported. Supply a factory address.`);
  }

  return {
    titleEscrowFactory,
    tokenImplementation,
    deployer,
  } as DeployContractAddress;
};
