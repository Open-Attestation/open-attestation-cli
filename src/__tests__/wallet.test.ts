import chalk, { Level } from "chalk";
import { prompt } from "inquirer";
import path from "path";
import signale from "signale";
import { mocked } from "jest-mock";
import { handler as decrypt } from "../commands/wallet/decrypt";

jest.mock("inquirer");

const promptMock = mocked(prompt);

describe("wallet", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  let level = 0 as Level;
  beforeAll(() => {
    process.env.DISABLE_PROGRESS_BAR = "disabled";
    level = chalk.level;
    chalk.level = 0;
  });
  afterAll(() => {
    delete process.env.DISABLE_PROGRESS_BAR;
    chalk.level = level;
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("decrypt", () => {
    it("should work when user consent correctly", async () => {
      const signaleSuccessSpy = jest.spyOn(signale, "success");
      promptMock.mockResolvedValueOnce({ ack: "yes" }); // what the user type
      promptMock.mockResolvedValueOnce({ password: "password123" }); // wallet password
      await decrypt({
        inputFile: path.resolve("src", "implementations", "utils", "__tests__", "wallet.json").toString(),
        yes: false,
      });
      expect(signaleSuccessSpy.mock.calls[0]).toMatchInlineSnapshot(`
[
  "Wallet information:
- address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
- public key: 0x041bb90fbd443ca6a4ebced8272b99ea2488aae0520a354218a6184f7eebc8662e935ed19382363541d598cf584c90f08c95d42d69ffdba482a3a111ac80ddce0d
- private key 0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2
",
]
`);
    });
    it("should fail when user does not consent correctly", async () => {
      const signaleErrorSpy = jest.spyOn(signale, "error");
      promptMock.mockResolvedValueOnce({ ack: "no!!" }); // what the user type
      await decrypt({
        inputFile: path.resolve("src", "implementations", "utils", "__tests__", "wallet.json").toString(),
        yes: false,
      });
      expect(signaleErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
[
  "Incorrect acknowledgement of risks.",
]
`);
    });
    it("should work when user consent automatically", async () => {
      const signaleSuccessSpy = jest.spyOn(signale, "success");
      promptMock.mockResolvedValueOnce({ password: "password123" }); // wallet password
      await decrypt({
        inputFile: path.resolve("src", "implementations", "utils", "__tests__", "wallet.json").toString(),
        yes: true,
      });
      expect(signaleSuccessSpy.mock.calls[0]).toMatchInlineSnapshot(`
[
  "Wallet information:
- address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
- public key: 0x041bb90fbd443ca6a4ebced8272b99ea2488aae0520a354218a6184f7eebc8662e935ed19382363541d598cf584c90f08c95d42d69ffdba482a3a111ac80ddce0d
- private key 0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2
",
]
`);
    });
  });
});
