import { readFileSync } from "fs";
import signale, { Signale } from "signale";
import { ethers, getDefaultProvider, Wallet } from "ethers";
import { WalletOption, NetworkOption } from "../../commands/shared";
import { readFile } from "./disk";
import inquirer from "inquirer";
const interactive = new Signale({ interactive: true, scope: "" });

const getKeyFromFile = (file?: string): undefined | string => {
  return file ? readFileSync(file).toString() : undefined;
};

const getPrivateKey = ({ keyFile, key }: WalletOption): string | undefined => {
  if (key) {
    signale.warn(
      "Be aware that by using the `key` parameter, the private key may be stored in your machine's sh history"
    );
    signale.warn(
      "Other options are available: using a file with `key-file` option or using `OA_PRIVATE_KEY` environment variable"
    );
  }
  return key || getKeyFromFile(keyFile) || process.env["OA_PRIVATE_KEY"];
};

const defaultProgress = (progress: number): void => {
  const stepInPercentage = 5; // one dot = 5%
  const numberOfSteps = 100 / stepInPercentage;
  const numberOfStepsDone = Math.floor((progress * 100) / stepInPercentage);
  const numberOfStepsLeft = numberOfSteps - numberOfStepsDone;
  interactive.await(
    `Decrypting wallet [${"=".repeat(numberOfStepsDone)}${"-".repeat(numberOfStepsLeft)}] [%d/100%]`,
    (progress * 100).toFixed()
  );
};

export const getWallet = async ({
  keyFile,
  key,
  network,
  encryptedWalletPath,
  progress = defaultProgress
}: WalletOption & NetworkOption & { progress?: (progress: number) => void }): Promise<Wallet> => {
  const provider = getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
  if (encryptedWalletPath) {
    const { password } = await inquirer.prompt({ type: "password", name: "password", message: "Wallet password" });

    const file = await readFile(encryptedWalletPath);
    const wallet = await ethers.Wallet.fromEncryptedJson(file, password, progress);
    signale.info("Wallet successfully decrypted");
    return wallet.connect(provider);
  } else {
    const privateKey = getPrivateKey({ key, keyFile });

    if (!privateKey)
      throw new Error(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path"
      );

    return new Wallet(privateKey, provider);
  }
};
