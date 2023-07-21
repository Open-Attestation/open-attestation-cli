import { ethers } from "ethers";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import signale from "signale";
import { CreateWalletCommand } from "../../commands/wallet/wallet.type";
import { progress as defaultProgress } from "../../implementations/utils/progress";
import { getEtherscanAddress, highlight } from "../../utils";

export const create = async ({
  progress = defaultProgress("Encrypting Wallet"),
  outputFile,
}: CreateWalletCommand & { progress?: (progress: number) => void }): Promise<string> => {
  const wallet = ethers.Wallet.createRandom();
  const { password } = await inquirer.prompt({
    type: "password",
    name: "password",
    message: "Wallet password",
  });

  const json = await wallet.encrypt(password, progress);
  const outputPath = path.resolve(outputFile);
  fs.writeFileSync(outputPath, json);

  signale.info(`Wallet with public address ${highlight(wallet.address)} successfully created.`);
  signale.info(`Find more details at ${getEtherscanAddress({ network: "sepolia" })}/address/${wallet.address}`);

  return outputPath;
};
