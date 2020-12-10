import { GasOption, NetworkAndKeyOption } from "../shared";

export interface GsnCapableSetPaymasterCommand extends NetworkAndKeyOption, GasOption {
  gsnCapableAddress: string;
  paymasterAddress: string;
}
