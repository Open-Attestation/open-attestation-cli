import { TDocDeployer__factory } from "@tradetrust-tt/token-registry/contracts";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { encodeInitParams } from "./helpers";
import { deployTokenRegistry } from "./token-registry";

const deployParams: DeployTokenRegistryCommand = {
  registryName: "Test",
  registrySymbol: "Tst",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
  standalone: false,
};

const mockedTradeTrustToken_Deploy = jest.fn();
jest.mock("@tradetrust-tt/token-registry/contracts", () => ({
  ...jest.requireActual("@tradetrust-tt/token-registry/contracts"),
  TradeTrustToken__factory: jest.fn().mockImplementation(() => ({
    deploy: mockedTradeTrustToken_Deploy,
  })),
}));

describe("deploy Token Registry", () => {
  let mockedTDocDeployer_Deploy: jest.Mock;

  beforeAll(() => {
    mockedTDocDeployer_Deploy = jest.fn();
    const factoryMock = jest.spyOn(TDocDeployer__factory, "connect");
    factoryMock.mockImplementation(
      () =>
        ({
          interface: {
            getEventTopic: jest
              .fn()
              .mockReturnValue("0x3588ebb5c75fdf91927f8472318f41513ee567c2612a5ce52ac840dcf6f162f5"),
            parseLog: jest.fn().mockReturnValue({
              args: {
                deployed: "0x45c382574bb1B9C432a2e100Ab2086A4EAcB73Fd",
              },
            }),
          },
          deploy: mockedTDocDeployer_Deploy,
        } as any)
    );
  });

  // increase timeout because ethers is throttling
  jest.setTimeout(30000);

  beforeEach(() => {
    mockedTDocDeployer_Deploy.mockReset();
    mockedTDocDeployer_Deploy.mockResolvedValue({
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
                "0x45c382574bb1B9C432a2e100Ab2086A4EAcB73Fd",
                "0x8d366250A96deBE81C8619459a503a0eEBE33ca6",
                "0x878A327daA390Bc602Ae259D3A374610356b6485",
                "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca60000000000000000000000000000000000000000000000000000000000000011563420546f6b656e20526567697374727900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034d54540000000000000000000000000000000000000000000000000000000000",
              ] as unknown as any,
            },
          ],
        }),
    });

    mockedTradeTrustToken_Deploy.mockReset();
    mockedTradeTrustToken_Deploy.mockResolvedValue({
      address: "0x75d83d2cdc9cbe12f4192725c47a54330cd535f8",
      deployTransaction: {
        wait: jest.fn().mockResolvedValue({
          events: [],
        }),
      },
    });
  });

  it("should pass in the correct params and return the deployed instance", async () => {
    const result = await deployTokenRegistry(deployParams);

    const expectedInitParams = encodeInitParams({
      name: deployParams.registryName,
      symbol: deployParams.registrySymbol,
      deployer: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    });

    expect(mockedTDocDeployer_Deploy.mock.calls[0][0]).toBe("0x45c382574bb1B9C432a2e100Ab2086A4EAcB73Fd");
    expect(mockedTDocDeployer_Deploy.mock.calls[0][1]).toEqual(expectedInitParams);

    expect(result).toMatchInlineSnapshot(`
      {
        "contractAddress": "0x45c382574bb1B9C432a2e100Ab2086A4EAcB73Fd",
        "transaction": {
          "events": [
            {
              "args": [
                "0xd6C249d0756059E21Ef4Aef4711B69b76927BEA7",
                "0x45c382574bb1B9C432a2e100Ab2086A4EAcB73Fd",
                "0x8d366250A96deBE81C8619459a503a0eEBE33ca6",
                "0x878A327daA390Bc602Ae259D3A374610356b6485",
                "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca60000000000000000000000000000000000000000000000000000000000000011563420546f6b656e20526567697374727900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034d54540000000000000000000000000000000000000000000000000000000000",
              ],
              "data": "0x000000000000000000000000878a327daa390bc602ae259d3a374610356b6485000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca60000000000000000000000000000000000000000000000000000000000000011563420546f6b656e20526567697374727900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034d54540000000000000000000000000000000000000000000000000000000000",
              "topics": [
                "0x3588ebb5c75fdf91927f8472318f41513ee567c2612a5ce52ac840dcf6f162f5",
                "0x000000000000000000000000426c58c2b29111eafc53bdcb9c99dc7714fdb262",
                "0x000000000000000000000000e5c75026d5f636c89cc77583b6bce7c99f512763",
                "0x0000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca6",
              ],
            },
          ],
        },
      }
    `);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should pass in the correct params with standalone and return the deployed instance", async () => {
    const deployStandalone = {
      ...deployParams,
      standalone: true,
      factory: "0xfcafea839e576967b96ad1FBFB52b5CA26cd1D25",
    };
    const result = await deployTokenRegistry(deployStandalone);

    expect(mockedTradeTrustToken_Deploy.mock.calls[0][0]).toBe(deployStandalone.registryName);
    expect(mockedTradeTrustToken_Deploy.mock.calls[0][1]).toBe(deployStandalone.registrySymbol);
    expect(mockedTradeTrustToken_Deploy.mock.calls[0][2]).toBe(deployStandalone.factory);

    expect(result).toMatchInlineSnapshot(`
      {
        "contractAddress": "0x75d83d2cdc9cbe12f4192725c47a54330cd535f8",
        "transaction": {
          "events": [],
        },
      }
    `);
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

    expect(mockedTDocDeployer_Deploy.mock.calls[0][0]).toBe("0x45c382574bb1B9C432a2e100Ab2086A4EAcB73Fd");
    expect(mockedTDocDeployer_Deploy.mock.calls[0][1]).toEqual(expectedInitParams);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should allow errors to bubble up", async () => {
    mockedTDocDeployer_Deploy.mockRejectedValue(new Error("An Error"));
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
