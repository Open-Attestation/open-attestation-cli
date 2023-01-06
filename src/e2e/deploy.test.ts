import { run } from "./utils/shell";
import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../commands/deploy/deploy.types";
import { isAddress } from "web3-utils";
import { defaultRunParameters, EndStatus, owner } from "./utils/constants";
import { generateDeployDocumentStoreCommand, generateDeployTokenRegistryCommand } from "./utils/commands";
import { getSigner, retrieveTokenInfo, rolesCheck } from "./utils/contract-checks";
import { checkTokenRegistrySuccess, defaultTokenRegistry } from "./utils/bootstrap";

describe("deploy token-registry", () => {
  jest.setTimeout(90000);

  it("should be able to deploy token-registry", async () => {
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
    expect(tokenInfo.name).toBe(tokenRegistryParameter.registryName);
    expect(tokenInfo.symbol).toBe(tokenRegistryParameter.registrySymbol);
    const rolesInfo = await rolesCheck(signer, tokenRegistryAddress);
    expect(rolesInfo.accepterRole).toBe(true);
    expect(rolesInfo.defaultRole).toBe(true);
    expect(rolesInfo.minterRole).toBe(true);
    expect(rolesInfo.restorerRole).toBe(true);
  });
});

describe("deploy document-store", () => {
  jest.setTimeout(90000);

  it("should be able to deploy document-store", async () => {
    const documentStoreParameters: DeployDocumentStoreCommand = {
      storeName: "Test Document Store",
      ...defaultRunParameters,
    };

    const command = generateDeployDocumentStoreCommand(documentStoreParameters, owner.privateKey);
    const results = run(command);
    const tokenRegistrySuccessFormat = `${EndStatus.success}   Document store Test Document Store deployed at `;
    const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    expect(checkSuccess).toBe(true);
    const splitResults = results.trim().split("\n");
    const tokenRegistryAddressLine = splitResults[splitResults.length - 2];
    const tokenRegistryAddress = tokenRegistryAddressLine.trim().substring(tokenRegistrySuccessFormat.length);
    expect(isAddress(tokenRegistryAddress)).toBe(true);
  });
});
