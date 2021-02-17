import { NaivePaymasterFactory } from "@govtechsg/document-store";
import { getLogger } from "../../logger";
import { PaymasterSupportsContractCommand } from "../../commands/paymaster/paymaster-command.type";
import { getProvider } from "../utils/provider";

const { trace } = getLogger("paymaster:supports-contract");

export const paymasterSupportsContract = async ({
  targetAddress,
  paymasterAddress,
  network,
}: PaymasterSupportsContractCommand): Promise<boolean> => {
  const provider = getProvider(network);
  const isSupported = await NaivePaymasterFactory.connect(paymasterAddress, provider).supportsAddress(targetAddress);
  trace(`Selected network: ${network}`);
  trace(`Is address supported: ${isSupported}`);
  return isSupported;
};
