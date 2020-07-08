import { ethers } from "ethers";
import inquirer from "inquirer";
import path from "path";
import signale from "signale";
import { highlight } from "../../utils";
import fs from "fs";
import { CreateWalletCommand } from "../../commands/wallet/wallet.type";
import { progress as defaultProgress } from "../../implementations/utils/progress";
import fetch from "node-fetch";

export const create = async ({
  fund,
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

  if (fund === "ropsten") {
    const response = await fetch(`https://faucet.ropsten.be/donate/${wallet.address}`).then((res) => res.json());
    if (response.message) {
      signale.warn(`[ropsten] Adding fund to ${wallet.address} failed: ${response.message}`);
    } else {
      signale.info(`[ropsten] Added fund to ${wallet.address}`);
    }
  }
  signale.info(`Wallet with public address ${highlight(wallet.address)} successfully created. Find more details:`);

  return outputPath;
};
