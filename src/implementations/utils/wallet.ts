import { readFileSync } from "fs";
import signale from "signale";
import { ethers, getDefaultProvider, Wallet, providers } from "ethers";
import { NetworkOption, WalletOption } from "../../commands/shared";
import { readFile } from "./disk";
import inquirer from "inquirer";
import { progress as defaultProgress } from "./progress";

const getKeyFromFile = (file?: string): undefined | string => {
  return file ? readFileSync(file).toString().trim() : undefined;
};

export const getPrivateKey = ({ keyFile, key }: WalletOption): string | undefined => {
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
export const getWallet = async ({
  keyFile,
  key,
  network,
  encryptedWalletPath,
  progress = defaultProgress("Decrypting Wallet"),
}: WalletOption & Partial<NetworkOption> & { progress?: (progress: number) => void }): Promise<Wallet> => {
  const provider =
    network === "local"
      ? new providers.JsonRpcProvider()
      : getDefaultProvider(network === "mainnet" ? "homestead" : network); // homestead => aka mainnet
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

    const hexlifiedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    return new Wallet(hexlifiedPrivateKey, provider);
  }
};
