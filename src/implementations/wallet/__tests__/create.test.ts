import { create } from "../create";
import { prompt } from "inquirer";
import tmp from "tmp";
import fs from "fs";
import { ethers } from "ethers";
jest.mock("inquirer");
const password = "password123";

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const promptMock: jest.Mock = prompt;

describe("create wallet", () => {
  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    promptMock.mockRestore();
  });
  it("shoud save the wallet into the provided path", async () => {
    promptMock.mockReturnValue({ password });
    const file = tmp.fileSync();
    await create({ outputFile: file.name, progress: () => void 0 });
    const walletAsString = fs.readFileSync(file.name, "utf-8");
    expect(JSON.parse(walletAsString)).toStrictEqual(
      expect.objectContaining({
        address: expect.any(String),
        id: expect.any(String),
        Crypto: {
          cipher: "aes-128-ctr",
          cipherparams: {
            iv: expect.any(String)
          },
          ciphertext: expect.any(String),
          kdf: "scrypt",
          kdfparams: {
            salt: expect.any(String),
            n: 131072,
            dklen: 32,
            p: 1,
            r: 8
          },
          mac: expect.any(String)
        }
      })
    );

    const decryptedWallet = await ethers.Wallet.fromEncryptedJson(walletAsString, password);
    expect(decryptedWallet.address).toStrictEqual(expect.any(String));
    expect(decryptedWallet.privateKey).toStrictEqual(expect.any(String));
  });
});
