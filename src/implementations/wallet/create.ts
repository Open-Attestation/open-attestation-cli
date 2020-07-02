import { ethers } from "ethers";
import inquirer from "inquirer";
import path from "path";
import signale from "signale";
import { highlight } from "../../utils";
import fs from "fs";
import { CreateWalletCommand } from "../../commands/wallet/wallet.type";
import { progress as defaultProgress } from "../../implementations/utils/progress";

export const create = async ({
  progress = defaultProgress("Encrypting Wallet"),
  outputFile
}: CreateWalletCommand & { progress?: (progress: number) => void }): Promise<string> => {
  const wallet = ethers.Wallet.createRandom();
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
