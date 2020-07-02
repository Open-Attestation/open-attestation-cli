import { Wallet } from "ethers";
import signale, { info } from "signale";
import inquirer from "inquirer";
import path from "path";
import { highlight } from "../../utils";
import fs from "fs";
import { progress as defaultProgress } from "../utils/progress";
import { EncryptWalletCommand } from "../../commands/wallet/wallet.type";
import { getPrivateKey } from "../utils/wallet";

export const encrypt = async ({
  progress = defaultProgress("Encrypting Wallet"),
  outputFile,
  ...args
}: EncryptWalletCommand & { progress?: (progress: number) => void }): Promise<string> => {
  const privateKey = getPrivateKey(args);
  if (!privateKey) {
    throw new Error("No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one");
  }
  const wallet = new Wallet(privateKey);

  info(`Encrypting a wallet`);
  const { password } = await inquirer.prompt({
    type: "password",
    name: "password",
    message: "Wallet password"
  });

  const json = await wallet.encrypt(password, progress);
  const outputPath = path.resolve(outputFile);
  signale.info(`Wallet with public address ${highlight(wallet.address)} successfully created. Find more details:`);
  fs.writeFileSync(outputPath, json);
  return outputPath;
};
