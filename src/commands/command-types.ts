import { NetworkOption } from "./shared";

export interface VerifyCommand extends NetworkOption {
  document: string;
  verbose: boolean;
}
