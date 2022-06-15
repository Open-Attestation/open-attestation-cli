import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { TradeTrustErc721Factory } from "@govtechsg/token-registry-v2";
import { Wallet, Contract } from "ethers";
import { checkTokenRegistryVersion, connectToTokenRegistry } from "./helpers";

jest.mock("@govtechsg/token-registry");
jest.mock("@govtechsg/token-registry-v2");
jest.mock("ethers");

describe("token-registry", () => {
  describe("issue", () => {
    jest.setTimeout(30000);
    const mockedTradeTrustErc721Factory: jest.Mock<TradeTrustErc721Factory> = TradeTrustErc721Factory as any;
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721Factory> = TradeTrustERC721Factory as any;
    const mockedContract: jest.Mock<Contract> = Contract as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectV3: jest.Mock = mockedTradeTrustERC721Factory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectV2: jest.Mock = mockedTradeTrustErc721Factory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedCreateInterface: jest.Mock = mockedTradeTrustERC721Factory.createInterface;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectContract: jest.Mock = mockedContract.prototype.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedIssue = jest.fn();

    mockedIssue.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    const mockCallStaticSafeMint = jest.fn();

    const mockTTERC721Contract = {
      mintTitle: mockedIssue,
      callStatic: {
        "mintTitle(address,address,uint256)": mockCallStaticSafeMint,
      },
    };

    const mockSupportInterfacesFunctionFragmentFormat = jest.fn();

    mockSupportInterfacesFunctionFragmentFormat.mockReturnValue("asd");

    const mockSupportInterfacesFunctionFragment = jest.fn();
    mockSupportInterfacesFunctionFragment.mockReturnValue({
      format: jest.fn(() => {
        "asd";
      }),
    });
    const mockSupportInterfacesCallStatic = jest.fn();
    mockedConnectContract.mockReturnValue({
      callStatic: {
        "supportsInterface(bytes4)": mockSupportInterfacesCallStatic,
      },
    });

    mockedCreateInterface.mockReturnValue({
      functions: {
        "supportsInterface(bytes4)": {
          format: jest.fn(() => {
            "asd";
          }),
        },
      },
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockSupportInterfacesCallStatic.mockReturnValue(false);
      mockedConnectV2.mockResolvedValue(mockTTERC721Contract);
      mockedConnectV3.mockResolvedValue(mockTTERC721Contract);
    });

    it("check v2", async () => {
      mockSupportInterfacesCallStatic.mockReturnValue(true);
      const tokenRegistryVersion: boolean = await checkTokenRegistryVersion({
        address: "0x1234",
        wallet: new Wallet("0000000000000000000000000000000000000000000000000000000000000002"),
      });
      expect(tokenRegistryVersion).toBe(false);
    });

    it("check v3", async () => {
      mockSupportInterfacesCallStatic.mockReturnValue(false);
      const tokenRegistryVersion: boolean = await checkTokenRegistryVersion({
        address: "0x1234",
        wallet: new Wallet("0000000000000000000000000000000000000000000000000000000000000002"),
      });
      expect(tokenRegistryVersion).toBe(true);
    });

    it("get V3 contract", async () => {
      mockSupportInterfacesCallStatic.mockReturnValue(false);
      const tokenRegistryResponse = await connectToTokenRegistry({
        address: "0x1234",
        wallet: new Wallet("0000000000000000000000000000000000000000000000000000000000000002"),
      });
      expect(tokenRegistryResponse["isV3"]).toBe(true);
    });

    it("get V2 contract", async () => {
      mockSupportInterfacesCallStatic.mockReturnValue(true);
      const tokenRegistryResponse = await connectToTokenRegistry({
        address: "0x1234",
        wallet: new Wallet("0000000000000000000000000000000000000000000000000000000000000002"),
      });
      expect(tokenRegistryResponse["isV3"]).toBe(false);
    });
  });
});
