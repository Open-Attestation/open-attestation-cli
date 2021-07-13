// import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
// import { Wallet } from "ethers";
// import { join } from "path";
// import { TitleEscrowSurrenderDocumentCommand } from "../../../commands/title-escrow-2/title-escrow-command.type";
// import { rejectSurrendered } from "./reject-surrendered";

// jest.mock("@govtechsg/token-registry");

// const rejectSurrenderedDocumentParams: TitleEscrowSurrenderDocumentCommand = {
//   tokenRegistry: "0x1122",
//   tokenId: "0x12345",
//   network: "ropsten",
//   gasPriceScale: 1,
//   dryRun: false,
// };

// // TODO the following test is very fragile and might break on every interface change of TradeTrustErc721Factory
// // ideally must setup ganache, and run the function over it
// describe("title-escrow", () => {
//   describe("rejects surrendered transferable record", () => {
//     const mockedTradeTrustErc721Factory: jest.Mock<TradeTrustErc721Factory> = TradeTrustErc721Factory as any;
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore mock static method
//     const mockedConnectERC721: jest.Mock = mockedTradeTrustErc721Factory.connect;
//     const mockedTitleEscrowFactory: jest.Mock<TitleEscrowFactory> = TitleEscrowFactory as any;
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore mock static method
//     const mockedConnectTitleEscrowFactory: jest.Mock = mockedTitleEscrowFactory.connect;

//     const mockedBeneficiary = jest.fn();
//     const mockedHolder = jest.fn();
//     const mockSendToNewTitleEscrow = jest.fn();

//     const mockedTitleEscrowAddress = "0xMockedTitleEscrowAddress";
//     const mockedLastBeneficiary = "0xMockedLastBeneficiaryAddress";
//     const mockedLastHolder = "0xMockedLastHolderAddress";

//     mockedBeneficiary.mockReturnValue(mockedLastBeneficiary);
//     mockedHolder.mockReturnValue(mockedLastHolder);
//     mockSendToNewTitleEscrow.mockReturnValue({
//       hash: "hash",
//       wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
//     });

//     beforeEach(() => {
//       delete process.env.OA_PRIVATE_KEY;
//       mockedTradeTrustErc721Factory.mockReset();
//       mockedConnectERC721.mockReset();
//       mockedTitleEscrowFactory.mockReset();
//       mockedConnectTitleEscrowFactory.mockReset();

//       mockedConnectTitleEscrowFactory.mockReturnValue({
//         beneficiary: mockedBeneficiary,
//         holder: mockedHolder,
//       });
//       mockedConnectERC721.mockReturnValue({
//         sendToNewTitleEscrow: mockSendToNewTitleEscrow,
//       });

//       mockedBeneficiary.mockClear();
//       mockedHolder.mockClear();
//       mockSendToNewTitleEscrow.mockClear();
//     });

//     // it("should take in the key from environment variable", async () => {
//     //   process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

//     //   await rejectSurrendered(rejectSurrenderedDocumentParams);

//     //   const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
//     //   expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
//     // });

//     // it("should take in the key from key file", async () => {
//     //   await rejectSurrendered({
//     //     ...rejectSurrenderedDocumentParams,
//     //     keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
//     //   });

//     //   const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];
//     //   expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
//     // });

//     it("should pass in the correct params and successfully rejects a surrendered transferable record", async () => {
//       const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
//       await rejectSurrendered({
//         ...rejectSurrenderedDocumentParams,
//         key: privateKey,
//       });

//       const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

//       expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
//       expect(mockedConnectERC721).toHaveBeenCalledWith(rejectSurrenderedDocumentParams.tokenRegistry, passedSigner);
//       expect(mockedConnectTitleEscrowFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
//       expect(mockedBeneficiary).toHaveBeenCalledTimes(1);
//       expect(mockedHolder).toHaveBeenCalledTimes(1);
//       expect(mockSendToNewTitleEscrow).toHaveBeenCalledTimes(1);
//     });

//     // it("should allow errors to bubble up", async () => {
//     //   process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
//     //   mockedConnectERC721.mockImplementation(() => {
//     //     throw new Error("An Error");
//     //   });
//     //   await expect(rejectSurrendered(rejectSurrenderedDocumentParams)).rejects.toThrow("An Error");
//     // });

//     // it("should throw when keys are not found anywhere", async () => {
//     //   await expect(rejectSurrendered(rejectSurrenderedDocumentParams)).rejects.toThrow(
//     //     "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
//     //   );
//     // });
//   });
// });
