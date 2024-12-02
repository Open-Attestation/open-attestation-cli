import { encrypt } from "../encrypt";
import { prompt } from "inquirer";
import tmp from "tmp";
import fs from "fs";
import { ethers } from "ethers";
jest.mock("inquirer");

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock: jest.Mock = prompt;
const privateKey = "0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2";
const password = "password123";

describe("create wallet", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  afterEach(() => {
    promptMock.mockRestore();
  });
  it("shoud throw an error when no key is provided", async () => {
    promptMock.mockReturnValue({ password });
    const file = tmp.fileSync();
    await expect(encrypt({ outputFile: file.name, progress: () => void 0 })).rejects.toStrictEqual(
      new Error("No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one")
    );
  });

  it("shoud encrypt the wallet when the key is provided with the key option", async () => {
    promptMock.mockReturnValue({ password });
    const file = tmp.fileSync();
    await encrypt({ key: privateKey, outputFile: file.name, progress: () => void 0 });
    const walletAsString = fs.readFileSync(file.name, "utf-8");
    expect(JSON.parse(walletAsString)).toStrictEqual(
      expect.objectContaining({
        address: expect.any(String),
        id: expect.any(String),
        crypto: {
          cipher: "aes-128-ctr",
          cipherparams: {
            iv: expect.any(String),
          },
          ciphertext: expect.any(String),
          kdf: "scrypt",
          kdfparams: {
            salt: expect.any(String),
            n: 131072,
            dklen: 32,
            p: 1,
            r: 8,
          },
          mac: expect.any(String),
        },
      })
    );

    const decryptedWallet = await ethers.Wallet.fromEncryptedJson(walletAsString, password);
    expect(decryptedWallet.address).toBe("0xB26B4941941C51a4885E5B7D3A1B861E54405f90");
    expect(decryptedWallet.privateKey).toStrictEqual(privateKey);
  });
});
