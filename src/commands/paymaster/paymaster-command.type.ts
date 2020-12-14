import { GasOption, NetworkAndKeyOption, NetworkOption } from "../shared";

export interface PaymasterAddTargetCommand extends NetworkAndKeyOption, GasOption {
  targetAddress: string;
  paymasterAddress: string;
}

export interface PaymasterRemoveTargetCommand extends NetworkAndKeyOption, GasOption {
  targetAddress: string;
  paymasterAddress: string;
}

export interface PaymasterSupportsContractCommand extends NetworkOption {
  targetAddress: string;
  paymasterAddress: string;
}
