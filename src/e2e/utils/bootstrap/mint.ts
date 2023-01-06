import { Wallet } from "ethers";
import { isAddress } from "web3-utils";
import { deployTokenRegistry } from ".";
import { TokenRegistryIssueCommand } from "../../../commands/token-registry/token-registry-command.type";
import { generateMintTitleEscrowCommand } from "../commands";
import { AddressLength, defaultRunParameters, EndStatus, TokenIdLength, TokenInfo } from "../constants";
import { getSigner, retrieveTitleEscrowOwner } from "../contract-checks";
import { extractStatus, run } from "../shell";
import { generateTokenId, isTokenId } from "../token-management";

export interface MintData {
  tokenId: string;
  address: string;
  beneficiary: string;
  holder: string;
}

export const validateMintData = (expectedValue: MintData, value: MintData) => {
  expect(expectedValue.address).toBe(value.address);
  expect(expectedValue.beneficiary).toBe(value.beneficiary);
  expect(expectedValue.holder).toBe(value.holder);
  expect(expectedValue.tokenId).toBe(value.tokenId);
};

export const mintTokenRegistry = (privateKey: string, tokenRegistryAddress?: string): TokenInfo => {
  if (!tokenRegistryAddress) {
    tokenRegistryAddress = deployTokenRegistry(privateKey);
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

  return mintToken(privateKey, titleEscrowParameter);
};


export const checkMintSuccess = (results: string): MintData => {
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

export const mintToken = (privateKey: string, titleEscrowParameter: TokenRegistryIssueCommand): TokenInfo => {
  const command = generateMintTitleEscrowCommand(titleEscrowParameter, privateKey);
  const results = run(command);
  const {address: tokenRegistry, tokenId, beneficiary, holder} = checkMintSuccess(results);
  const signer = getSigner(titleEscrowParameter.network, privateKey);
  // let titleEscrowAddress: string = retrieveTitleEscrowOwner(
  //   signer,
  //   tokenRegistry,
  //   tokenId,
  // );
  return {
    tokenRegistry,
    tokenId,
    // titleEscrowAddress,
  };
};
