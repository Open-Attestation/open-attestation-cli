import { setTargetToPaymaster } from "./setTarget";
import { join } from "path";
import { Wallet } from "ethers";
import { NaivePaymasterFactory } from "@govtechsg/document-store";
import { PaymasterSetTargetCommand } from "../../commands/paymaster/paymaster-command.type";

jest.mock("@govtechsg/document-store");

const deployParams: PaymasterSetTargetCommand = {
  targetAddress: "0xabcd",
  paymasterAddress: "0x1234",
  network: "ropsten",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  gasPriceScale: 1,
  dryRun: false,
};

describe("paymaster", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("setTargetToPaymaster", () => {
    const mockedPaymasterFactory: jest.Mock<NaivePaymasterFactory> = NaivePaymasterFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedPaymasterFactory.connect;
    const mockedSetTarget = jest.fn();

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedPaymasterFactory.mockReset();
      mockedConnect.mockReset();
      mockedConnect.mockReturnValue({
        setTarget: mockedSetTarget,
      });
      mockedSetTarget.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await setTargetToPaymaster({
        targetAddress: "0xabcd",
        paymasterAddress: "0x1234",
        network: "ropsten",
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await setTargetToPaymaster({
        targetAddress: "0xabcd",
        paymasterAddress: "0x1234",
        network: "ropsten",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        gasPriceScale: 1,
        dryRun: false,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and run setTarget on targetAddress", async () => {
      const instance = await setTargetToPaymaster(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.paymasterAddress);
      expect(mockedSetTarget.mock.calls[0][0]).toEqual(deployParams.targetAddress);
      // @ts-expect-error invalid structure
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should allow errors to bubble up", async () => {
      mockedConnect.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(setTargetToPaymaster(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        setTargetToPaymaster({
          targetAddress: "0xabcd",
          paymasterAddress: "0x1234",
          network: "ropsten",
          gasPriceScale: 1,
          dryRun: false,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );
    });
  });
});
