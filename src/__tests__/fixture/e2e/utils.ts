import { isAddress } from "web3-utils";
import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { creators, emoji, network } from "./constants";
import { run } from "./shell";
import { Wallet } from "ethers";
import { TokenRegistryIssueCommand } from "../../../commands/token-registry/token-registry-command.type";
import {
  generateDeployDocumentStoreCommand,
  generateDeployTokenRegistryCommand,
  generateMintTitleEscrowCommand,
} from "./commands";

const defaults = {
  factoryAddress: creators.titleEscrowFactory,
  tokenImplementationAddress: creators.tokenImplementation,
  deployerAddress: creators.deployer,
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
    const index = numberGenerator(2);
    tokenRegistryParameters = {
      registryName: `Test Tokenx ${index}`,
      registrySymbol: `TKNx${index}`,
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
    const index = numberGenerator(2);
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

const usedTokenIds = new Set();
export const generateTokenId = (): string => {
  for (let count = 0; count < 10; count = count + 1) {
    const generatedTokenId = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const unique = !usedTokenIds.has(generatedTokenId);
    if (unique) {
      usedTokenIds.add(generatedTokenId);
      return generatedTokenId;
    }
  }
  throw new Error("Unable to generate tokenIds");
};

export const mintToken = (privateKey: string, titleEscrowParameter?: TokenRegistryIssueCommand): string => {
  if (!titleEscrowParameter) {
    const wallet = new Wallet(privateKey);
    titleEscrowParameter = {
      address: deployTokenRegistry(privateKey),
      beneficiary: wallet.address,
      holder: wallet.address,
      tokenId: generateTokenId(),
      ...defaults,
    };
  }

  const command = generateMintTitleEscrowCommand(titleEscrowParameter, privateKey);
  const results = run(command, true);
  const tokenRegistrySuccessFormat = `${emoji.tick}  success   Token with hash `;
  const checkSuccess = results.includes(tokenRegistrySuccessFormat);
  if (!checkSuccess) throw new Error("Unable to mint token");
  const splitResults = results.trim().split("\n");
  const titleEscrowAddressLine = splitResults[splitResults.length - 2];
  const titleEscrowAddress = titleEscrowAddressLine.trim().substring(115, 115 + 42);
  if (!isAddress(titleEscrowAddress)) throw new Error("Unable to find token");
  return titleEscrowAddress;
};
