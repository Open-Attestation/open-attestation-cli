import { GasOption, NetworkAndKeyOption, NetworkOption } from "../shared";

export interface PaymasterSetTargetCommand extends NetworkAndKeyOption, GasOption {
  targetAddress: string;
  paymasterAddress: string;
}

export interface PaymasterRemoveTargetCommand extends NetworkAndKeyOption, GasOption {
  targetAddress: string;
  paymasterAddress: string;
}

export interface PaymasterSupportsAddressCommand extends NetworkOption {
  targetAddress: string;
  paymasterAddress: string;
}
