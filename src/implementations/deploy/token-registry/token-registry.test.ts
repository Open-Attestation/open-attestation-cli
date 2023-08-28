import { deployTokenRegistry } from "./token-registry";
import { encodeInitParams } from "./helpers";
import { Contract } from "ethers";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { DeploymentEvent } from "@govtechsg/token-registry/dist/contracts/contracts/utils/TDocDeployer";

const deployParams: DeployTokenRegistryCommand = {
  registryName: "Test",
  registrySymbol: "Tst",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
  standalone: false,
};

describe("deploy Token Registry", () => {
  const mockedEthersContract: jest.Mock<Contract> = Contract as any;
  // eslint-disable-next-line jest/prefer-spy-on
  mockedEthersContract.prototype.deploy = jest.fn();
  const mockedDeploy: jest.Mock = mockedEthersContract.prototype.deploy;

  // increase timeout because ethers is throttling
  jest.setTimeout(30000);

  beforeEach(() => {
    mockedDeploy.mockReset();
    mockedDeploy.mockResolvedValue({
      hash: "hash",
      blockNumber: "blockNumber",
      wait: () =>
        Promise.resolve({
          events: [
            {
              topics: [
                "0x3588ebb5c75fdf91927f8472318f41513ee567c2612a5ce52ac840dcf6f162f5", // deployment
                "0x000000000000000000000000426c58c2b29111eafc53bdcb9c99dc7714fdb262",
                "0x000000000000000000000000e5c75026d5f636c89cc77583b6bce7c99f512763",
                "0x0000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca6",
              ],
              data: "0x000000000000000000000000878a327daa390bc602ae259d3a374610356b6485000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca60000000000000000000000000000000000000000000000000000000000000011563420546f6b656e20526567697374727900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034d54540000000000000000000000000000000000000000000000000000000000",
              args: [
                "0xd6C249d0756059E21Ef4Aef4711B69b76927BEA7",
                "0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6",
                "0x8d366250A96deBE81C8619459a503a0eEBE33ca6",
                "0x878A327daA390Bc602Ae259D3A374610356b6485",
                "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca60000000000000000000000000000000000000000000000000000000000000011563420546f6b656e20526567697374727900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034d54540000000000000000000000000000000000000000000000000000000000",
              ] as unknown as DeploymentEvent,
            },
          ],
        }),
    });
  });

  it("should pass in the correct params and return the deployed instance", async () => {
    await deployTokenRegistry(deployParams);

    const expectedInitParams = encodeInitParams({
      name: deployParams.registryName,
      symbol: deployParams.registrySymbol,
      deployer: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    });

    expect(mockedDeploy.mock.calls[0][0]).toEqual("0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6");
    expect(mockedDeploy.mock.calls[0][1]).toEqual(expectedInitParams);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should pass in the correct params with standalone and return the deployed instance", async () => {
    const deployStandalone = {
      standalone: true,
      ...deployParams,
    };
    await deployTokenRegistry(deployStandalone);

    const expectedInitParams = encodeInitParams({
      name: deployParams.registryName,
      symbol: deployParams.registrySymbol,
      deployer: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    });

    expect(mockedDeploy.mock.calls[0][0]).toEqual("0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6");
    expect(mockedDeploy.mock.calls[0][1]).toEqual(expectedInitParams);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should pass in the correct params with unspecified standalone and return the deployed instance", async () => {
    const deployParamsUnspecified = deployParams;
    delete deployParamsUnspecified.standalone;
    await deployTokenRegistry(deployParamsUnspecified);

    const expectedInitParams = encodeInitParams({
      name: deployParams.registryName,
      symbol: deployParams.registrySymbol,
      deployer: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    });

    expect(mockedDeploy.mock.calls[0][0]).toEqual("0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6");
    expect(mockedDeploy.mock.calls[0][1]).toEqual(expectedInitParams);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should allow errors to bubble up", async () => {
    mockedDeploy.mockRejectedValue(new Error("An Error"));
    await expect(deployTokenRegistry(deployParams)).rejects.toThrow("An Error");
  });

  it("should throw when keys are not found anywhere", async () => {
    delete process.env.OA_PRIVATE_KEY;
    await expect(
      deployTokenRegistry({
        registryName: "Test",
        registrySymbol: "Tst",
        network: "sepolia",
        dryRun: false,
        maxPriorityFeePerGasScale: 1.0,
      })
    ).rejects.toThrow(
      "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
    );
  });
});
