import { NaivePaymasterFactory } from "@govtechsg/document-store";
import { getLogger } from "../../logger";
import { PaymasterSupportsAddressCommand } from "../../commands/paymaster/paymaster-command.type";
import { getProvider } from "../utils/provider";

const { trace } = getLogger("paymaster:supports-address");

export const paymasterSupportsAddress = async ({
  targetAddress,
  paymasterAddress,
  network,
}: PaymasterSupportsAddressCommand): Promise<boolean> => {
  const provider = getProvider(network);
  const isSupported = await NaivePaymasterFactory.connect(paymasterAddress, provider).supportsAddress(targetAddress);
  trace(`Selected network: ${network}`);
  trace(`Is address supported: ${isSupported}`);
  return isSupported;
};
