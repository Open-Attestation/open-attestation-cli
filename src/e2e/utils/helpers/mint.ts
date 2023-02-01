import { Wallet } from "ethers";
import { isAddress } from "web3-utils";
import { deployE2ETokenRegistry } from ".";
import { TokenRegistryIssueCommand } from "../../../commands/token-registry/token-registry-command.type";
import { generateMintTitleEscrowCommand } from "../commands";
import { AddressLength, defaultRunParameters, EndStatus, TokenIdLength, TokenInfo } from "../constants";
import { extractStatus, run } from "../shell";
import { generateTokenId, isTokenId } from "../token-management";

export interface E2EMintData {
  tokenId: string;
  address: string;
  beneficiary: string;
  holder: string;
}

export const validateE2EMintData = (expectedValue: E2EMintData, value: E2EMintData): void => {
  if (!(expectedValue.address === value.address)) throw new Error(`expectedValue.address === value.address`);
  if (!(expectedValue.beneficiary === value.beneficiary))
    throw new Error(`expectedValue.beneficiary === value.beneficiary`);
  if (!(expectedValue.holder === value.holder)) throw new Error(`expectedValue.holder === value.holder`);
  if (!(expectedValue.tokenId === value.tokenId)) throw new Error(`expectedValue.tokenId === value.tokenId`);
};

export const mintE2ETokenRegistry = (privateKey: string, tokenRegistryAddress?: string): TokenInfo => {
  if (!tokenRegistryAddress) {
    tokenRegistryAddress = deployE2ETokenRegistry(privateKey);
  }
  if (!isAddress(tokenRegistryAddress)) throw new Error("Invalid Token Registry Address");
  const wallet = new Wallet(privateKey);
  const titleEscrowParameter: TokenRegistryIssueCommand = {
    ...defaultRunParameters,
    address: tokenRegistryAddress,
    beneficiary: wallet.address,
    holder: wallet.address,
    tokenId: generateTokenId(),
  };

  return mintE2EToken(privateKey, titleEscrowParameter);
};

export const checkE2EMintSuccess = (results: string): E2EMintData => {
  const statusLine = extractStatus(results, EndStatus.success, "Token with hash ");
  if (statusLine.length <= 0) throw new Error("Minting failed");
  const titleEscrowAddressLine = statusLine[0].lineContent;
  const tokenId = titleEscrowAddressLine.substring(29, 29 + TokenIdLength);
  const address = titleEscrowAddressLine.substring(115, 115 + AddressLength);
  const beneficiary = titleEscrowAddressLine.substring(191, 191 + AddressLength);
  const holder = titleEscrowAddressLine.substring(253, 253 + AddressLength);

  const tokenRegistryAddressIsAddress = isAddress(address);
  const beneficiaryIsAddress = isAddress(beneficiary);
  const holderIsAddress = isAddress(holder);
  const isValidTokenId = isTokenId(tokenId);

  if (!tokenRegistryAddressIsAddress) throw new Error("Invalid token registry address");
  if (!beneficiaryIsAddress) throw new Error("Invalid receipient address");
  if (!holderIsAddress) throw new Error("Invalid holder address");
  if (!isValidTokenId) throw new Error("Invalid token id");

  return {
    address,
    beneficiary,
    holder,
    tokenId,
  };
};

export const mintE2EToken = (privateKey: string, titleEscrowParameter: TokenRegistryIssueCommand): TokenInfo => {
  const command = generateMintTitleEscrowCommand(titleEscrowParameter, privateKey);
  const results = run(command);
  const { address: tokenRegistry, tokenId } = checkE2EMintSuccess(results);
  return {
    tokenRegistry,
    tokenId,
  };
};
