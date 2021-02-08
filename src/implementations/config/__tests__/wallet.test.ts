import { prompt } from "inquirer";
import { getWallet } from "../create";
import walletJson from "./wallet.json";
jest.mock("inquirer");

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock: jest.Mock = prompt;

const walletAddress = "0x709731d94D65b078496937655582401157c8A640";

describe("wallet", () => {
  afterEach(() => {
    delete process.env.OA_PRIVATE_KEY;
    promptMock.mockRestore();
  });
  it("should return the wallet when providing an encrypted wallet", async () => {
    promptMock.mockReturnValue({ password: "password" });

    const wallet = await getWallet({
      network: "ropsten",
      walletJson: JSON.stringify(walletJson),
      progress: () => void 0, // shut up progress bar
    });
    expect(wallet.address).toStrictEqual(walletAddress);
  });
  it("should throw an error when the wallet password is invalid", async () => {
    promptMock.mockReturnValue({ password: "invalid" });

    await expect(
      getWallet({
        network: "ropsten",
        walletJson: JSON.stringify(walletJson),
        progress: () => void 0, // shut up progress bar
      })
    ).rejects.toStrictEqual(new Error("invalid password"));
  });
});
