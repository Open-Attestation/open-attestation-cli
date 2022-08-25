import { TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { Wallet, Contract } from "ethers";
import { connectToTokenRegistry } from "./helpers";

jest.mock("@govtechsg/token-registry");
jest.mock("ethers");

describe("token-registry", () => {
  describe("issue", () => {
    jest.setTimeout(30000);
    const mockedTradeTrustERC721Factory: jest.Mock<TradeTrustERC721Factory> = TradeTrustERC721Factory as any;
    const mockedContract: jest.Mock<Contract> = Contract as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectV3: jest.Mock = mockedTradeTrustERC721Factory.connect;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    // const mockedCreateInterface: jest.Mock = mockedTradeTrustERC721Factory.createInterface;
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

    // mockedCreateInterface.mockReturnValue({
    //   functions: {
    //     "supportsInterface(bytes4)": {
    //       format: jest.fn(() => {
    //         "asd";
    //       }),
    //     },
    //   },
    // });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      // mockSupportInterfacesCallStatic.mockReturnValue(false);
      mockedConnectV3.mockResolvedValue(mockTTERC721Contract);
    });

    it("get V3 contract", async () => {
      mockSupportInterfacesCallStatic.mockReturnValue(false);
      const tokenRegistryResponse = await connectToTokenRegistry({
        address: "0x1234",
        wallet: new Wallet("0000000000000000000000000000000000000000000000000000000000000002"),
      });
    });
  });
});
