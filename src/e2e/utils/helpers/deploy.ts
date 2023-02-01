import { isAddress } from "web3-utils";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { generateDeployTokenRegistryCommand } from "../commands";
import { defaultRunParameters, creators, EndStatus, AddressLength } from "../constants";
import { extractStatus, run } from "../shell";

export const defaultE2ETokenRegistryParams = {
  ...defaultRunParameters,
  factoryAddress: creators.titleEscrowFactory,
  tokenImplementationAddress: creators.tokenImplementation,
  deployerAddress: creators.deployer,
};

const numberGenerator = (range: number): number => {
  return Math.floor(Math.random() * range);
};

export const checkE2ETokenRegistrySuccess = (results: string): string => {
  const statusLine = extractStatus(results, EndStatus.success, "Token registry deployed at ");
  if (statusLine.length <= 0) throw new Error("Deployment failed");
  const tokenRegistryDeploymentLine = statusLine[0].lineContent;
  const tokenRegistry = tokenRegistryDeploymentLine.substring(40, 40 + AddressLength);

  const tokenRegistryIsAddress = isAddress(tokenRegistry);
  if (!tokenRegistryIsAddress) throw new Error("Invalid token registry address");
  return tokenRegistry;
};

export const deployE2ETokenRegistry = (
  privateKey: string,
  tokenRegistryParameters?: DeployTokenRegistryCommand
): string => {
  if (!tokenRegistryParameters) {
    const index = numberGenerator(100);
    tokenRegistryParameters = {
      ...defaultE2ETokenRegistryParams,
      registryName: `Test Token ${index}`,
      registrySymbol: `TKN${index}`,
    };
  }
  const command = generateDeployTokenRegistryCommand(tokenRegistryParameters, privateKey);
  const results = run(command);
  const tokenRegistryAddress = checkE2ETokenRegistrySuccess(results);
  return tokenRegistryAddress;
};
