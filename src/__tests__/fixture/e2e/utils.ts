import { isAddress } from "web3-utils";
import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { creators, emoji, network } from "./constants";
import { extractLine, LineInfo, run } from "./shell";
import { Wallet } from "ethers";
import { TokenRegistryIssueCommand } from "../../../commands/token-registry/token-registry-command.type";
import {
  generateDeployDocumentStoreCommand,
  generateDeployTokenRegistryCommand,
  generateMintTitleEscrowCommand,
  generateNominateCommand,
  generateSurrenderCommand,
} from "./commands";
import {
  BaseTitleEscrowCommand,
  TitleEscrowNominateBeneficiaryCommand,
} from "../../../commands/title-escrow/title-escrow-command.type";
export interface TokenInfo {
  tokenRegistry: string;
  tokenId: string;
  titleEscrowAddress?: string;
}

const defaults = {
  network: network,
  dryRun: false,
};

const numberGenerator = (range: number): number => {
  return Math.floor(Math.random() * range);
};

export const deployTokenRegistry = (
  privateKey: string,
  tokenRegistryParameters?: DeployTokenRegistryCommand
): string => {
  if (!tokenRegistryParameters) {
    const index = numberGenerator(100);
    tokenRegistryParameters = {
      registryName: `Test Token ${index}`,
      registrySymbol: `TKN${index}`,
      factoryAddress: creators.titleEscrowFactory,
      tokenImplementationAddress: creators.tokenImplementation,
      deployerAddress: creators.deployer,
      ...defaults,
    };
  }
  const command = generateDeployTokenRegistryCommand(tokenRegistryParameters, privateKey);
  const results = run(command, true);
  const tokenRegistrySuccessFormat = `${emoji.tick}  success   Token registry deployed at `;
  const checkSuccess = results.includes(tokenRegistrySuccessFormat);
  if (!checkSuccess) throw new Error("Unable to deploy the token registry");
  const splitResults = results.trim().split("\n");
  const tokenRegistryAddressLine = splitResults[splitResults.length - 2];
  const tokenRegistryAddress = tokenRegistryAddressLine.trim().substring(tokenRegistrySuccessFormat.length);
  if (!isAddress(tokenRegistryAddress)) throw new Error("Unable to find token registry address");
  return tokenRegistryAddress;
};

export const deployDocumentStore = (
  privateKey: string,
  documentStoreParameters?: DeployDocumentStoreCommand
): string => {
  if (!documentStoreParameters) {
    const index = numberGenerator(100);
    documentStoreParameters = {
      storeName: `Test Document Store ${index}`,
      ...defaults,
    };
  }
  const command = generateDeployDocumentStoreCommand(documentStoreParameters, privateKey);
  const results = run(command, true);
  const documentStoreSuccessFormat = `${emoji.tick}  success   Document store Test Document Store deployed at `;
  const checkSuccess = results.includes(documentStoreSuccessFormat);
  if (!checkSuccess) throw new Error("Unable to deploy document store");
  const splitResults = results.trim().split("\n");
  const documentStoreAddressLine = splitResults[splitResults.length - 2];
  const documentStoreAddress = documentStoreAddressLine.trim().substring(documentStoreSuccessFormat.length);
  if (!isAddress(documentStoreAddress)) throw new Error("Unable to find document store address");
  return documentStoreAddress;
};

const retries = 10;
const usedTokenIds = new Set();
export const generateTokenId = (): string => {
  for (let count = 0; count < retries; count = count + 1) {
    const generatedTokenId = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const unique = !usedTokenIds.has(generatedTokenId);
    if (unique) {
      usedTokenIds.add(generatedTokenId);
      return generatedTokenId;
    }
  }
  throw new Error("Unable to generate tokenIds");
};

export const mintTokenRegistry = (privateKey: string, tokenRegistryAddress?: string): TokenInfo => {
  if (!tokenRegistryAddress) {
    tokenRegistryAddress = deployTokenRegistry(privateKey);
  }
  if (!isAddress(tokenRegistryAddress)) throw new Error("Invalid Token Registry Address");
  const wallet = new Wallet(privateKey);
  const titleEscrowParameter: TokenRegistryIssueCommand = {
    address: tokenRegistryAddress,
    beneficiary: wallet.address,
    holder: wallet.address,
    tokenId: generateTokenId(),
    ...defaults,
  };

  return mintToken(privateKey, titleEscrowParameter);
};

export const mintToken = (privateKey: string, titleEscrowParameter: TokenRegistryIssueCommand): TokenInfo => {
  const command = generateMintTitleEscrowCommand(titleEscrowParameter, privateKey);
  const results = run(command, true);
  const tokenRegistrySuccessFormat = `${emoji.tick}  success   Token with hash `;
  const checkSuccess = results.includes(tokenRegistrySuccessFormat);
  if (!checkSuccess) throw new Error("Unable to mint token");
  const splitResults = results.trim().split("\n");
  const titleEscrowAddressLine = splitResults[splitResults.length - 2];
  const titleEscrowAddress = titleEscrowAddressLine.trim().substring(115, 115 + 42);
  if (!isAddress(titleEscrowAddress)) throw new Error("Unable to find token");
  return {
    tokenRegistry: titleEscrowParameter.address,
    tokenId: titleEscrowParameter.tokenId,
    titleEscrowAddress,
  };
};

export const mintNominatedToken = (privateKey: string, nominee: string, tokenRegistryAddress?: string): TokenInfo => {
  const tokenDetails = mintTokenRegistry(privateKey, tokenRegistryAddress);
  const { tokenRegistry, tokenId } = tokenDetails;
  const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
    tokenId: tokenId,
    tokenRegistry: tokenRegistry,
    newBeneficiary: nominee,
    ...defaults,
  };
  nominateToken(privateKey, nominateParameter);
  return tokenDetails;
};

export const nominateToken = (privateKey: string, nominateParameter: TitleEscrowNominateBeneficiaryCommand): void => {
  const command = generateNominateCommand(nominateParameter, privateKey);
  const results = run(command, true);
  const frontFormat = `${emoji.tick}  success   Transferable record with hash `;
  const middleFormat = `'s holder has been successfully nominated to new owner with address `;
  const queryResults = extractLine(results, frontFormat);
  if (!queryResults) throw new Error("Unable to nominate token");
  const filteredLine = (queryResults as LineInfo[])[0].lineContent.trim();
  const checkSuccess = filteredLine.includes(frontFormat);
  const checkContext = filteredLine.includes(middleFormat);
  if (!checkSuccess || !checkContext) throw new Error("Unexpected nominate token format");
  const resultTokenId = filteredLine.trim().substring(frontFormat.length, frontFormat.length + 66);
  if (resultTokenId !== nominateParameter.tokenId) throw new Error("Unexpected nominate tokenid");
  const destination = filteredLine.trim().substring(filteredLine.length - 42);
  if (destination !== nominateParameter.newBeneficiary) throw new Error("Unexpected nominee");
};

export const mintSurrenderToken = (privateKey: string, tokenRegistryAddress?: string): TokenInfo => {
  const tokenDetails = mintTokenRegistry(privateKey, tokenRegistryAddress);
  const { tokenRegistry, tokenId } = tokenDetails;
  const surrenderParameter: BaseTitleEscrowCommand = {
    tokenRegistry: tokenRegistry,
    tokenId: tokenId,
    ...defaults,
  };
  surrenderToken(privateKey, surrenderParameter);
  return tokenDetails;
};

export const surrenderToken = (privateKey: string, surrenderParameter: BaseTitleEscrowCommand): void => {
  const command = generateSurrenderCommand(surrenderParameter, privateKey);
  const results = run(command);

  const tokenRegistrySuccessFormat = `${emoji.tick}  success   Transferable record with hash `;
  const queryResults = extractLine(results, tokenRegistrySuccessFormat);
  if (!queryResults) throw new Error("Unable to surrender token");
  const filteredLine = (queryResults as LineInfo[])[0].lineContent.trim();
  const checkSuccess = filteredLine.includes(tokenRegistrySuccessFormat);
  if (!checkSuccess) throw new Error("Unexpected surrender token format");
  const resultTokenId = filteredLine
    .trim()
    .substring(tokenRegistrySuccessFormat.length, tokenRegistrySuccessFormat.length + 66);
  if (resultTokenId !== surrenderParameter.tokenId) throw new Error("Unexpected surrendered token");
};
