import { handler as decrypt } from "../commands/wallet/decrypt";
import path from "path";
import chalk, { Level } from "chalk";

import { uniqueNamesGenerator } from "unique-names-generator";
import { prompt } from "inquirer";
import signale from "signale";
import { mocked } from "ts-jest/utils";
jest.mock("inquirer");
jest.mock("unique-names-generator");

const promptMock = mocked(prompt);
const uniqueNamesGeneratorMock = mocked(uniqueNamesGenerator);

describe("wallet", () => {
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
      uniqueNamesGeneratorMock.mockReturnValueOnce("some-random-value"); // what the user must type
      promptMock.mockResolvedValueOnce({ ack: "some-random-value" }); // what the user type
      promptMock.mockResolvedValueOnce({ password: "password123" }); // wallet password
      await decrypt({
        inputFile: path.resolve("src", "implementations", "utils", "__tests__", "wallet.json").toString(),
      });
      expect(signaleSuccessSpy.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          "Wallet information:
        - address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
        - public key: 0x041bb90fbd443ca6a4ebced8272b99ea2488aae0520a354218a6184f7eebc8662e935ed19382363541d598cf584c90f08c95d42d69ffdba482a3a111ac80ddce0d
        - private key 0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2
        ",
        ]
      `);
    });
    it("should work when user does not consent correctly", async () => {
      const signaleErrorSpy = jest.spyOn(signale, "error");
      uniqueNamesGeneratorMock.mockReturnValueOnce("some-random-value"); // what the user must type
      promptMock.mockResolvedValueOnce({ ack: "no!!" }); // what the user type
      await decrypt({
        inputFile: path.resolve("src", "implementations", "utils", "__tests__", "wallet.json").toString(),
      });
      expect(signaleErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          "Incorrect acknowledgement of risks.",
        ]
      `);
    });
  });
});
