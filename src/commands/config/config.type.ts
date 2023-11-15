import { NetworkCmdName } from "../../common/networks";

export interface CreateConfigCommand {
  network: NetworkCmdName;
  outputDir: string;
  encryptedWalletPath: string;
  configTemplatePath: string;
  configTemplateUrl: string;
}

export enum TestNetwork {
  Local = "local",
  Sepolia = "sepolia",
  Mumbai = "mumbai (polygon)",
  Apothem = "apothem (xdc)",
}
