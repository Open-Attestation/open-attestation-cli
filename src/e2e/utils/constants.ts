import { constants } from "@govtechsg/token-registry";
export const { contractAddress } = constants;

export const silent = true;
export const verbose = false;

export const network = "local";
export const chainId = 1337;
export const forkedNetwork = 5;

export const mnemonic = "indicate swing place chair flight used hammer soon photo region volume shuffle";

export const BurnAddress = "0x0000000000000000000000000000000000000000";
export const EmptyTokenID = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const owner = {
  ethAddress: "0xe0A71284EF59483795053266CB796B65E48B5124",
  privateKey: "0xe82294532bcfcd8e0763ee5cef194f36f00396be59b94fb418f5f8d83140d9a7",
};

export const receiver = {
  ethAddress: "0xcDFAcbb428DD30ddf6d99875dcad04CbEFcd6E60",
  privateKey: "0xc58c1ff75001afdca8cecb61b47f36964febe4188b8f7b26252286ecae5a8879",
};

export const thirdParty = {
  ethAddress: "0x391aFf3942857a10958425FebF1fC1938D9F5AE7",
  privateKey: "0x3760fb287bee810607433485cfa3fc665c2d682a1816991dccce645b096ae19a",
};

export const creators = {
  titleEscrowFactory: contractAddress.TitleEscrowFactory[forkedNetwork],
  deployer: contractAddress.Deployer[forkedNetwork],
  tokenImplementation: contractAddress.TokenImplementation[forkedNetwork],
};

export const EndStatus = {
  success: "✔  success",
  error: "✖  error",
} as const;

export const TokenIdLength = 66;
export const AddressLength = 42;

export type EndStatusType = typeof EndStatus[keyof typeof EndStatus];

export const defaultRunParameters = {
  network: network,
  dryRun: false,
};

export interface TokenInfo {
  tokenRegistry: string;
  tokenId: string;
  titleEscrowAddress?: string;
}

export interface Owners {
  owner: string;
  holder: string;
}
