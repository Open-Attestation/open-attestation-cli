import { NetworkCmdName } from "../networks";
export interface CreateConfigCommand {
  network: NetworkCmdName;
  walletPassword: string;
  outputDir: string;
  encryptedWalletPath: string;
  configTemplatePath: string;
  configTemplateUrl: string;
}
