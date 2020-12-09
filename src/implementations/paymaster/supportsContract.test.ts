import { paymasterSupportsContract } from "./supportsContract";
import { NaivePaymasterFactory } from "@govtechsg/document-store";
import { PaymasterSupportsContractCommand } from "../../commands/paymaster/paymaster-command.type";
import { providers } from "ethers";
import { getInfuraKey } from "../utils/provider";

jest.mock("@govtechsg/document-store");

const deployParams: PaymasterSupportsContractCommand = {
  targetAddress: "0xabcd",
  paymasterAddress: "0x1234",
  network: "ropsten",
};

describe("paymaster", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("paymasterSupportsContract", () => {
    const mockedPaymasterFactory: jest.Mock<NaivePaymasterFactory> = NaivePaymasterFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedPaymasterFactory.connect;
    const mockedSupportsAddress = jest.fn();

    beforeEach(() => {
      delete process.env.INFURA_KEY;
      mockedPaymasterFactory.mockReset();
      mockedConnect.mockReset();
      mockedConnect.mockReturnValue({
        supportsAddress: mockedSupportsAddress,
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.INFURA_KEY = "bb46da3f80e040e8ab73c0a9ff365d18";

      await paymasterSupportsContract({
        targetAddress: "0xabcd",
        paymasterAddress: "0x1234",
        network: "ropsten",
      });

      const passedProvider: providers.InfuraProvider = mockedConnect.mock.calls[0][1];

      expect(passedProvider.apiKey).toBe(`${process.env.INFURA_KEY}`);
    });

    it("should pass in the correct params and run setTarget on targetAddress", async () => {
      mockedSupportsAddress.mockResolvedValueOnce(true);
      const response = await paymasterSupportsContract(deployParams);

      const passedProvider: providers.InfuraProvider = mockedConnect.mock.calls[0][1];
      expect(passedProvider.apiKey).toBe(getInfuraKey());
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.paymasterAddress);
      expect(mockedSupportsAddress.mock.calls[0][0]).toEqual(deployParams.targetAddress);
      expect(response).toEqual(true);
    });

    it("should allow errors to bubble up", async () => {
      mockedConnect.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(paymasterSupportsContract(deployParams)).rejects.toThrow("An Error");
    });
  });
});
