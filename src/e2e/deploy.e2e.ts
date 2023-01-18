import { run } from "./utils/shell";
import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../commands/deploy/deploy.types";
import { isAddress } from "web3-utils";
import { defaultRunParameters, EndStatus, owner } from "./utils/constants";
import { generateDeployDocumentStoreCommand, generateDeployTokenRegistryCommand } from "./utils/commands";
import { getSigner, retrieveTokenInfo, rolesCheck } from "./utils/contract-checks";
import { checkTokenRegistrySuccess, defaultTokenRegistry } from "./utils/helpers";

export const deployTokenRegistry = async (): Promise<void> => {
  //should be able to deploy token-registry"
  {
    const tokenRegistryParameter: DeployTokenRegistryCommand = {
      registryName: "Test Token",
      registrySymbol: "TKN",
      ...defaultTokenRegistry,
    };

    const command = generateDeployTokenRegistryCommand(tokenRegistryParameter, owner.privateKey);
    const results = run(command);
    const tokenRegistryAddress = checkTokenRegistrySuccess(results);
    const signer = getSigner(defaultRunParameters.network, owner.privateKey);
    const tokenInfo = await retrieveTokenInfo(signer, tokenRegistryAddress);
    if (!(tokenInfo.name === tokenRegistryParameter.registryName)) {
      throw new Error("tokenInfo.name === tokenRegistryParameter.registryName");
    }
    if (!(tokenInfo.symbol === tokenRegistryParameter.registrySymbol)) {
      throw new Error("tokenInfo.symbol === tokenRegistryParameter.registrySymbol");
    }
    const rolesInfo = await rolesCheck(signer, tokenRegistryAddress);
    if (!(rolesInfo.accepterRole === true)) {
      throw new Error("rolesInfo.accepterRole === true");
    }
    if (!(rolesInfo.defaultRole === true)) {
      throw new Error("rolesInfo.defaultRole === true");
    }
    if (!(rolesInfo.minterRole === true)) {
      throw new Error("rolesInfo.minterRole === true");
    }
    if (!(rolesInfo.restorerRole === true)) {
      throw new Error("rolesInfo.restorerRole === true");
    }
  }
};

export const deployDocumentStore = async (): Promise<void> => {
  //should be able to deploy document-store
  {
    const documentStoreParameters: DeployDocumentStoreCommand = {
      storeName: "Test Document Store",
      ...defaultRunParameters,
    };

    const command = generateDeployDocumentStoreCommand(documentStoreParameters, owner.privateKey);
    const results = run(command);
    const tokenRegistrySuccessFormat = `${EndStatus.success}   Document store Test Document Store deployed at `;
    const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    if (!(checkSuccess === true)) throw new Error(`checkSuccess === true)`);
    const splitResults = results.trim().split("\n");
    const tokenRegistryAddressLine = splitResults[splitResults.length - 2];
    const tokenRegistryAddress = tokenRegistryAddressLine.trim().substring(tokenRegistrySuccessFormat.length);
    if (!(isAddress(tokenRegistryAddress) === true)) throw new Error(`isAddress(tokenRegistryAddress) === true)`);
    if (!(isAddress(tokenRegistryAddress) === true)) {
      throw new Error("isAddress(tokenRegistryAddress) === true");
    }
  }
};
