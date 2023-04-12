import { ethers } from "ethers";
import { constants, utils } from "@govtechsg/token-registry";
import { TitleEscrow, TitleEscrowFactory } from "@govtechsg/token-registry/dist/contracts";
import { isAddress } from "ethers/lib/utils";

const { contractInterfaceId: CONTRACT_INTERFACE_ID, contractAddress: CONTRACT_ADDRESS } = constants;

export interface DeployContractAddress {
  TitleEscrowFactory?: string;
  TokenImplementation?: string;
  Deployer?: string;
}

export interface Params {
  name: string;
  symbol: string;
  deployer: string;
}

export const { getEventFromReceipt } = utils;

export const encodeInitParams = (params: { name: string; symbol: string; deployer: string }): string => {
  return utils.encodeInitParams(params);
};

export const getDefaultContractAddress = (chainId: number): DeployContractAddress => {
  const { TitleEscrowFactory, TokenImplementation, Deployer } = CONTRACT_ADDRESS;
  const chainTitleEscrowFactory = TitleEscrowFactory[chainId];
  const chainTokenImplementation = TokenImplementation[chainId];
  const chainDeployer = Deployer[chainId];
  return {
    TitleEscrowFactory: chainTitleEscrowFactory,
    TokenImplementation: chainTokenImplementation,
    Deployer: chainDeployer,
  };
};

export const isSupportedTitleEscrowFactory = async (
  factoryAddress: string,
  provider?: ethers.providers.Provider
): Promise<boolean> => {
  const titleEscrowFactoryContract = new ethers.Contract(
    factoryAddress,
    ["function implementation() view returns (address)"],
    provider ?? ethers.getDefaultProvider()
  ) as TitleEscrowFactory;
  const implAddr = await titleEscrowFactoryContract.implementation();

  const implContract = new ethers.Contract(
    implAddr,
    ["function supportsInterface(bytes4 interfaceId) view returns (bool)"],
    provider ?? ethers.getDefaultProvider()
  ) as TitleEscrow;
  const { TitleEscrow: titleEscrowInterfaceId } = CONTRACT_INTERFACE_ID;
  return implContract.supportsInterface(titleEscrowInterfaceId);
};

export const isValidAddress = (address?: string): boolean => {
  if (!address) return false;
  return isAddress(address);
};
