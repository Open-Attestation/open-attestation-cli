import { prompt } from "inquirer";
import path from "path";
import { getWalletOrSigner } from "../wallet";
jest.mock("inquirer");

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock: jest.Mock = prompt;

const privateKey = "0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2";
const walletAddress = "0xB26B4941941C51a4885E5B7D3A1B861E54405f90";

describe("wallet", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  afterEach(() => {
    delete process.env.OA_PRIVATE_KEY;
    promptMock.mockRestore();
  });
  it("should return the wallet when providing the key using environment variable", async () => {
    process.env.OA_PRIVATE_KEY = privateKey;
    const wallet = await getWalletOrSigner({ network: "sepolia" });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key option", async () => {
    const wallet = await getWalletOrSigner({ network: "sepolia", key: privateKey });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key-file option", async () => {
    const wallet = await getWalletOrSigner({ network: "sepolia", keyFile: path.resolve(__dirname, "./key.file") });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing an encrypted wallet", async () => {
    promptMock.mockReturnValue({ password: "password123" });

    const wallet = await getWalletOrSigner({
      network: "sepolia",
      encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
      progress: () => void 0, // shut up progress bar
    });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should throw an error when the wallet password is invalid", async () => {
    promptMock.mockReturnValue({ password: "invalid" });

    await expect(
      getWalletOrSigner({
        network: "sepolia",
        encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
        progress: () => void 0, // shut up progress bar
      })
    ).rejects.toStrictEqual(new Error("invalid password"));
  });
  it("should throw an error when no option is provided", async () => {
    await expect(getWalletOrSigner({ network: "sepolia" })).rejects.toStrictEqual(
      new Error(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      )
    );
  });
});
