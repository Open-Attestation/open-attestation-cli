import { deployTokenRegistry, encodeInitParams } from "./token-registry";
import { BigNumber, Contract, ContractReceipt } from "ethers";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { DeploymentEvent } from "@govtechsg/token-registry/dist/contracts/contracts/utils/TDocDeployer";
import { getEventFromReceipt } from "./token-registry";

const deployParams: DeployTokenRegistryCommand = {
  registryName: "Test",
  registrySymbol: "Tst",
  network: "goerli",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  gasPriceScale: 1,
  dryRun: false,
};

describe("token-registry", () => {
  describe("deployTokenRegistry", () => {
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
                  "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
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

      expect(mockedDeploy.mock.calls[0][0]).toEqual("0xE5C75026d5f636C89cc77583B6BCe7C99F512763");
      expect(mockedDeploy.mock.calls[0][1]).toEqual(expectedInitParams);

      // price should be any length string of digits
      expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
      // expect(instance.contractAddress).toBe("contractAddress"); // TODO
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployTokenRegistry(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        deployTokenRegistry({
          registryName: "Test",
          registrySymbol: "Tst",
          network: "goerli",
          gasPriceScale: 1,
          dryRun: false,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });
  });

  describe("getEventFromReceipt", () => {
    it("should return the event from the receipt", async () => {
      const receipt = {
        to: '0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57',
        from: '0x8d366250A96deBE81C8619459a503a0eEBE33ca6',
        contractAddress: null,
        transactionIndex: 36,
        gasUsed: { _hex: '0x0496e5', _isBigNumber: true } as BigNumber,
        logsBloom: '0x0000000400000080000000000000800000000100000000000000000000000000000000008000000000000000000000410000000000000000000200000000000000000000000000000000000000000000000000001800000040000000000000000040000002000000000000000000080000100000100000000000000000100000000000004000000040000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000110080000000000000000000000000000000000000002000100000000000010000000000002000000000000000000000000000010001000040000000c400400000000001400000',
        blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826',
        transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
        logs: [
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 86,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826'
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 87,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826'
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 88,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826'
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 89,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826'
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57',
            topics: [],
            data: '0x000000000000000000000000878a327daa390bc602ae259d3a374610356b6485000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca60000000000000000000000000000000000000000000000000000000000000011563420546f6b656e20526567697374727900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034d54540000000000000000000000000000000000000000000000000000000000',
            logIndex: 90,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826'
          }
        ],
        blockNumber: 7725626,
        confirmations: 1,
        cumulativeGasUsed: { _hex: '0x013255bb', _isBigNumber: true } as BigNumber,
        effectiveGasPrice: { _hex: '0x030d31', _isBigNumber: true } as BigNumber,
        status: 1,
        type: 2,
        byzantium: true,
        events: [
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 86,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826',
            removeListener: [Function],
            getBlock: [Function],
            getTransaction: [Function],
            getTransactionReceipt: [Function]
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 87,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826',
            removeListener: [Function],
            getBlock: [Function],
            getTransaction: [Function],
            getTransactionReceipt: [Function]
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 88,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826',
            removeListener: [Function],
            getBlock: [Function],
            getTransaction: [Function],
            getTransactionReceipt: [Function]
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x426c58C2B29111eAfc53bDcB9C99DC7714FDb262',
            topics: [],
            data: '0x',
            logIndex: 89,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826',
            removeListener: [Function],
            getBlock: [Function],
            getTransaction: [Function],
            getTransactionReceipt: [Function]
          },
          {
            transactionIndex: 36,
            blockNumber: 7725626,
            transactionHash: '0x3deb27a2513e3e421e12aa1ff54f11c98abe78020bff9c0b902861f83a808346',
            address: '0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57',
            topics: ['0x3588ebb5c75fdf91927f8472318f41513ee567c2612a5ce52ac840dcf6f162f5'],
            data: '0x000000000000000000000000878a327daa390bc602ae259d3a374610356b6485000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008d366250a96debe81c8619459a503a0eebe33ca60000000000000000000000000000000000000000000000000000000000000011563420546f6b656e20526567697374727900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034d54540000000000000000000000000000000000000000000000000000000000',
            logIndex: 90,
            blockHash: '0xc9b9a44452c0131ed1859f79b90ca4eb5b66a90b458cf852faedaa38e3d40826',
            args: [],
            decode: [],
            event: 'Deployment',
            eventSignature: 'Deployment(address,address,address,address,bytes)',
            removeListener: [],
            getBlock: [],
            getTransaction: [],
            getTransactionReceipt: []
          }
        ]
      } as unknown as ContractReceipt;
      
      const topics = '0x3588ebb5c75fdf91927f8472318f41513ee567c2612a5ce52ac840dcf6f162f5';

      console.log(getEventFromReceipt(receipt, topics, undefined));

    });
  })
});
