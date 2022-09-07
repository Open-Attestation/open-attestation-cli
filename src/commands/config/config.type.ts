import { Network } from "../../implementations/config/types";

export interface CreateConfigCommand {
  outputDir: string;
  encryptedWalletPath: string;
  configTemplatePath: string;
  configTemplateUrl: string;
  configNetwork: Network;
}
