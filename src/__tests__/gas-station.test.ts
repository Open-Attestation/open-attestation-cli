import fetch from "node-fetch";
import { gasStation } from "../common/gas-station";
import { BigNumber } from "ethers";
import { getSupportedNetwork } from "../common/networks";
import { getFeeData } from "../utils";

const mockData = {
  standard: {
    maxPriorityFee: 1.9666241746,
    maxFee: 1.9666241895999999,
  },
  fast: {
    maxPriorityFee: 2.5184666637333333,
    maxFee: 2.518466678733333,
  },
};

jest.mock("node-fetch");

jest.mock("../common/networks", () => ({
  getSupportedNetworkNameFromId: jest.fn(),
  getSupportedNetwork: jest.fn(),
}));

describe("gasStation", () => {
  describe("fetch gas fees", () => {
    it("should return undefined if no gasStationUrl is provided", async () => {
      const result = await gasStation("")();
      expect(result).toBeUndefined();
    });

    it("should fetch data from gasStationUrl and return GasStationFeeData", async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockData),
      } as any);

      const result = await gasStation("mock-url")();
      expect(result).toEqual({
        maxFeePerGas: BigNumber.from("1966624190"),
        maxPriorityFeePerGas: BigNumber.from("1966624175"),
      });
    });

    it("should throw an error if fetching fails", async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error("Fetch error"));

      await expect(gasStation("mock-url")()).rejects.toThrow("Failed to fetch gas station");
    });
  });

  describe("getFeeData", () => {
    const mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: "123" }),
      getFeeData: jest.fn().mockResolvedValue("providerFeeData"),
    };

    beforeEach(() => {
      mockProvider.getNetwork.mockClear();
      mockProvider.getFeeData.mockClear();
    });

    it("should get fee data from provider if gas station is not available", async () => {
      (getSupportedNetwork as jest.Mock).mockReturnValueOnce(undefined);

      const res = await getFeeData(mockProvider as any);

      expect(res).toBe("providerFeeData");
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(1);
    });

    it("should use the gas station when it is available", async () => {
      const mockGasStation = jest.fn().mockReturnValue("mockGasStationData");
      (getSupportedNetwork as jest.Mock).mockReturnValueOnce({ gasStation: mockGasStation });

      await getFeeData(mockProvider as any);

      expect(mockProvider.getFeeData).not.toHaveBeenCalled();
      expect(mockGasStation).toHaveBeenCalledTimes(1);
    });

    it("should get fee data from provider if gas station returns undefined", async () => {
      const mockGasStation = jest.fn().mockReturnValue(undefined);
      (getSupportedNetwork as jest.Mock).mockReturnValueOnce({ gasStation: mockGasStation });

      const res = await getFeeData(mockProvider as any);

      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(1);
      expect(mockGasStation).toHaveBeenCalledTimes(1);
      expect(res).toBe("providerFeeData");
    });
  });
});
