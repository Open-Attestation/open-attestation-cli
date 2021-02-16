import { getWallet } from "../wallet";
import path from "path";
import { prompt } from "inquirer";
jest.mock("inquirer");

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock: jest.Mock = prompt;

const privateKey = "0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2";
const walletAddress = "0xB26B4941941C51a4885E5B7D3A1B861E54405f90";

describe("wallet", () => {
  afterEach(() => {
    delete process.env.OA_PRIVATE_KEY;
    promptMock.mockRestore();
  });
  it("should return the wallet when providing the key using environment variable", async () => {
    process.env.OA_PRIVATE_KEY = privateKey;
    const wallet = await getWallet({ network: "ropsten" });
    expect(wallet.address).toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key option", async () => {
    const wallet = await getWallet({ network: "ropsten", key: privateKey });
    expect(wallet.address).toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key-file option", async () => {
    const wallet = await getWallet({ network: "ropsten", keyFile: path.resolve(__dirname, "./key.file") });
    expect(wallet.address).toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing an encrypted wallet", async () => {
    promptMock.mockReturnValue({ password: "password123" });

    const wallet = await getWallet({
      network: "ropsten",
      encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
      progress: () => void 0, // shut up progress bar
    });
    expect(wallet.address).toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  }, 20000);
  it("should throw an error when the wallet password is invalid", async () => {
    promptMock.mockReturnValue({ password: "invalid" });

    await expect(
      getWallet({
        network: "ropsten",
        encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
        progress: () => void 0, // shut up progress bar
      })
    ).rejects.toStrictEqual(new Error("invalid password"));
  }, 20000);
  it("should throw an error when no option is provided", async () => {
    await expect(getWallet({ network: "ropsten" })).rejects.toStrictEqual(
      new Error(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      )
    );
  });
});
