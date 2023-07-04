import { NetworkCmdName } from "../networks";

export interface CreateConfigCommand {
  network: NetworkCmdName;
  outputDir: string;
  encryptedWalletPath: string;
  configTemplatePath: string;
  configTemplateUrl: string;
}

export enum SelectNetwork {
  Local = "local",
  Goerli = "goerli (deprecated)",
  Sepolia = "sepolia",
  Mumbai = "mumbai (polygon)",
}
