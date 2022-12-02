import { isAddress } from "web3-utils";
import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../../commands/deploy/deploy.types";
import { creators, network } from "./accounts";
import shell, { ShellString } from "shelljs";
import { Wallet } from "ethers";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";

const defaults = {
    factoryAddress: creators.titleEscrowFactory,
    tokenImplementationAddress: creators.tokenImplementation,
    deployerAddress: creators.deployer,
    network: network,
    dryRun: false,
}


export const generateDeployTokenRegistryCommand = (tokenRegistryParameter: DeployTokenRegistryCommand, privateKey: string) => {
    return `npm run dev -- deploy token-registry "${tokenRegistryParameter.registryName}" ${tokenRegistryParameter.registrySymbol} -n ${tokenRegistryParameter.network} -k ${privateKey} --factory-address ${tokenRegistryParameter.factoryAddress} --token-implementation-address ${tokenRegistryParameter.tokenImplementationAddress} --deployer-address ${tokenRegistryParameter.deployerAddress}`
}

export const generateDeployDocumentStoreCommand = (documentStoreParameter: DeployDocumentStoreCommand, privateKey: string) => {
    return `npm run dev -- deploy document-store "${documentStoreParameter.storeName}"  -n ${documentStoreParameter.network} -k ${privateKey}`
}

export const generateMintTitleEscrowCommand = (titleEscrowParameter: TokenRegistryIssueCommand, privateKey: string) => {
    return `npm run dev -- token-registry mint --address ${titleEscrowParameter.address} --tokenId ${titleEscrowParameter.tokenId} --beneficiary ${titleEscrowParameter.beneficiary} --holder ${titleEscrowParameter.holder} -k ${privateKey} --n ${titleEscrowParameter.network}`
}



export const deployTokenRegistry = (privateKey: string, tokenRegistryParameters?: DeployTokenRegistryCommand): string => {
    if (!tokenRegistryParameters) {
        tokenRegistryParameters = {
            registryName: "Test Token",
            registrySymbol: "TKN",
            ...defaults
        };
    }

    const command = generateDeployTokenRegistryCommand(tokenRegistryParameters, privateKey);
    const results: ShellString = shell.exec(command);
    const tokenRegistrySuccessFormat = "✔  success   Token registry deployed at ";
    const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    if (!checkSuccess) throw new Error("Unable to deploy the token registry");
    const splitResults = results.trim().split("\n");
    const tokenRegistryAddressLine = splitResults[splitResults.length - 2]
    const tokenRegistryAddress = tokenRegistryAddressLine.trim().substring(tokenRegistrySuccessFormat.length)
    if (!isAddress(tokenRegistryAddress)) throw new Error("Unable to find token registry address");
    return tokenRegistryAddress;
}

export const deployDocumentStore = (privateKey: string, documentStoreParameters?: DeployDocumentStoreCommand): string => {
    if (!documentStoreParameters) {
        documentStoreParameters = {
            storeName: "Test Document Store",
            ...defaults
        };
    }
    const command = generateDeployDocumentStoreCommand(documentStoreParameters, privateKey);
    const results: ShellString = shell.exec(command);
    const documentStoreSuccessFormat = "✔  success   Document store Test Document Store deployed at ";
    const checkSuccess = results.includes(documentStoreSuccessFormat);
    if (!checkSuccess) throw new Error("Unable to deploy document store");
    const splitResults = results.trim().split("\n");
    const documentStoreAddressLine = splitResults[splitResults.length - 2]
    const documentStoreAddress = documentStoreAddressLine.trim().substring(documentStoreSuccessFormat.length)
    if (!isAddress(documentStoreAddress)) throw new Error("Unable to find document store address");
    return documentStoreAddress;
}

const usedTokenIds = new Set();
export const generateTokenId = () => {
    for (let count = 0; count < 10; count = count + 1) {
        const generatedTokenId = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const unique = !usedTokenIds.has(generatedTokenId);
        if(unique) {
            usedTokenIds.add(generatedTokenId);
            return generatedTokenId;
        }
    }
    throw new Error("Unable to generate tokenIds")
}

export const mintToken = (privateKey: string, titleEscrowParameter?: TokenRegistryIssueCommand) => {
    if (!titleEscrowParameter) {
        const wallet = new Wallet(privateKey);
        titleEscrowParameter = {
            address: deployTokenRegistry(privateKey),
            beneficiary: wallet.address,
            holder: wallet.address,
            tokenId: generateTokenId(),
            ...defaults,
        }
    }

    const command = generateMintTitleEscrowCommand(titleEscrowParameter, privateKey);
    const results: ShellString = shell.exec(command);
    const tokenRegistrySuccessFormat = "✔  success   Token with hash ";
    const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    if (!checkSuccess) throw new Error("Unable to mint token");
    const splitResults = results.trim().split("\n");
    const titleEscrowAddressLine = splitResults[splitResults.length - 2]
    const titleEscrowAddress = titleEscrowAddressLine.trim().substring(115, 115 + 42)
    if (!isAddress(titleEscrowAddress)) throw new Error("Unable to find token");
}

