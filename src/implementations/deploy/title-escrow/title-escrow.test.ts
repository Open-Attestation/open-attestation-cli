import { deployTitleEscrow } from "./title-escrow";
import { join } from "path";
import { TitleEscrowCloneableFactory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import { DeployTitleEscrowCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@govtechsg/token-registry");

const deployParams: DeployTitleEscrowCommand = {
  tokenRegistry: "0x0000000000000000000000000000000000000000",
  beneficiary: "0x0000000000000000000000000000000000000001",
  holder: "0x0000000000000000000000000000000000000002",
  titleEscrowFactory: "0x0000000000000000000000000000000000000003",
  network: "ropsten",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  gasPriceScale: 1,
  dryRun: false,
};

describe("token-registry", () => {
  test.todo("Not Implemented")
  // describe("deployTitleEscrow", () => {
  //   const tokenFactory: any = TitleEscrowCloneableFactory;
  //   const mockedTokenFactory: jest.Mock<TitleEscrowCloneableFactory> = tokenFactory;
  //   const mockedDeploy: jest.Mock = mockedTokenFactory.prototype.deploy;
  //   // increase timeout because ethers is throttling
  //   jest.setTimeout(30000);

  //   beforeEach(() => {
  //     mockedTokenFactory.mockReset();
  //     mockedDeploy.mockReset();
  //     mockedDeploy.mockResolvedValue({
  //       deployTransaction: { hash: "hash", wait: () => Promise.resolve({ contractAddress: "contractAddress" }) },
  //     });
  //   });

  //   it("should take in the key from environment variable", async () => {
  //     process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

  //     await deployTitleEscrow({
  //       tokenRegistry: "0x0000000000000000000000000000000000000000",
  //       beneficiary: "0x0000000000000000000000000000000000000001",
  //       holder: "0x0000000000000000000000000000000000000002",
  //       titleEscrowFactory: "0x0000000000000000000000000000000000000003",
  //       network: "ropsten",
  //       gasPriceScale: 1,
  //       dryRun: false,
  //     });

  //     const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
  //     expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
  //   });

  //   it("should take in the key from key file", async () => {
  //     await deployTitleEscrow({
  //       network: "ropsten",
  //       tokenRegistry: "0x0000000000000000000000000000000000000000",
  //       beneficiary: "0x0000000000000000000000000000000000000001",
  //       holder: "0x0000000000000000000000000000000000000002",
  //       titleEscrowFactory: "0x0000000000000000000000000000000000000003",
  //       keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
  //       gasPriceScale: 1,
  //       dryRun: false,
  //     });

  //     const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];
  //     expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
  //   });

  //   it("should pass in the correct params and return the deployed instance", async () => {
  //     const instance = await deployTitleEscrow(deployParams);

  //     const passedSigner: Wallet = mockedTokenFactory.mock.calls[0][0];

  //     expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
  //     expect(mockedDeploy.mock.calls[0][0]).toEqual("0x0000000000000000000000000000000000000000");
  //     expect(mockedDeploy.mock.calls[0][1]).toEqual("0x0000000000000000000000000000000000000001");
  //     expect(mockedDeploy.mock.calls[0][2]).toEqual("0x0000000000000000000000000000000000000002");
  //     expect(mockedDeploy.mock.calls[0][3]).toEqual("0x0000000000000000000000000000000000000003");
  //     // price should be any length string of digits
  //     expect(mockedDeploy.mock.calls[0][4].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
  //     expect(instance.contractAddress).toBe("contractAddress");
  //   });

  //   it("should allow errors to bubble up", async () => {
  //     mockedDeploy.mockRejectedValue(new Error("An Error"));
  //     await expect(deployTitleEscrow(deployParams)).rejects.toThrow("An Error");
  //   });

  //   it("should throw when keys are not found anywhere", async () => {
  //     delete process.env.OA_PRIVATE_KEY;
  //     await expect(
  //       deployTitleEscrow({
  //         network: "ropsten",
  //         tokenRegistry: "0x0000000000000000000000000000000000000000",
  //         beneficiary: "0x0000000000000000000000000000000000000001",
  //         holder: "0x0000000000000000000000000000000000000002",
  //         titleEscrowFactory: "0x0000000000000000000000000000000000000003",
  //         gasPriceScale: 1,
  //         dryRun: false,
  //       })
  //     ).rejects.toThrow(
  //       "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
  //     );
  //   });
  // });
});
