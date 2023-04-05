import { ethers } from "ethers";
import { constants, utils } from "@govtechsg/token-registry";
import { TitleEscrow, TitleEscrowFactory } from "@govtechsg/token-registry/dist/contracts";

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

export const { encodeInitParams, getEventFromReceipt } = utils;

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

// export const deployContract = async <TContract extends Contract, DeployerFactory extends ContractFactory>({
//   deployerAddress,
//   DeployerFactory,
//   params,
//   wallet,
// }: {
//   deployerAddress: string;
//   DeployerFactory: DeployerFactory;
//   params: any[];
//   wallet: Wallet | ConnectedSigner;
// }): Promise<TContract> => {
//   // new DeployerFactory();
//   // const contractFactory = new DeployerFactory(deployerAddress, contractInterface, wallet);
//   const contractFactory = new Contract(deployerAddress, contractInterface, wallet);
//   console.log(contractFactory)
//   const contract = (await contractFactory.deploy(...params)) as TContract;

//   const tx = contract.deployTransaction;
//   trace(`[Transaction] Pending ${tx.hash}`);

//   await contract.deployed();
//   trace(`[Address] Deployed to ${contract.address}`);

//   return contract;
// };

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
