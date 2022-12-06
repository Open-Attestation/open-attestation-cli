import { run } from "../fixture/e2e/shell";
import { DeployDocumentStoreCommand, DeployTokenRegistryCommand } from "../../commands/deploy/deploy.types";
import { isAddress } from "web3-utils";
import { creators, emoji, network, owner } from "../fixture/e2e/constants";
import { generateDeployDocumentStoreCommand, generateDeployTokenRegistryCommand } from "../fixture/e2e/commands";

const defaults = {
  factoryAddress: creators.titleEscrowFactory,
  tokenImplementationAddress: creators.tokenImplementation,
  deployerAddress: creators.deployer,
  network: network,
  dryRun: false,
};

describe("deploy token-registry", () => {
  jest.setTimeout(90000);

  it("should be able to deploy token-registry", async () => {
    const tokenRegistryParameter: DeployTokenRegistryCommand = {
      registryName: "Test Token",
      registrySymbol: "TKN",
      ...defaults,
    };

    const command = generateDeployTokenRegistryCommand(tokenRegistryParameter, owner.privateKey);
    const results = run(command);
    const tokenRegistrySuccessFormat = `${emoji.tick}  success   Token registry deployed at `;
    const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    expect(checkSuccess).toBe(true);
    const splitResults = results.trim().split("\n");
    const tokenRegistryAddressLine = splitResults[splitResults.length - 2];
    const tokenRegistryAddress = tokenRegistryAddressLine.trim().substring(tokenRegistrySuccessFormat.length);
    expect(isAddress(tokenRegistryAddress)).toBe(true);
  });
});

describe("deploy document-store", () => {
  jest.setTimeout(90000);

  it("should be able to deploy document-store", async () => {
    const documentStoreParameters: DeployDocumentStoreCommand = {
      storeName: "Test Document Store",
      ...defaults,
    };

    const command = generateDeployDocumentStoreCommand(documentStoreParameters, owner.privateKey);
    const results = run(command);
    const tokenRegistrySuccessFormat = `${emoji.tick}  success   Document store Test Document Store deployed at `;
    const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    expect(checkSuccess).toBe(true);
    const splitResults = results.trim().split("\n");
    const tokenRegistryAddressLine = splitResults[splitResults.length - 2];
    const tokenRegistryAddress = tokenRegistryAddressLine.trim().substring(tokenRegistrySuccessFormat.length);
    expect(isAddress(tokenRegistryAddress)).toBe(true);
  });
});
