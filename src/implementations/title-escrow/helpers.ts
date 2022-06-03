import { TitleEscrowCloneableFactory } from "@govtechsg/token-registry";
import { TitleEscrowFactory } from "@govtechsg/token-registry-v2";
import { Wallet, constants } from "ethers";
import signale from "signale";
import { connectToTokenRegistry } from "../token-registry/helpers";
import { ConnectedSigner } from "../utils/wallet";

interface ConnectToTitleEscrowArgs {
  tokenId: string;
  address: string;
  wallet: Wallet | ConnectedSigner;
}

interface ConnectToTitleEscrowReturnType {
  isV3: boolean;
  contract: TitleEscrowInstanceType;
}

type TitleEscrowInstanceType = ReturnType<
  typeof TitleEscrowCloneableFactory.connect | typeof TitleEscrowFactory.connect
>;

export const connectToTitleEscrow = async ({
  tokenId,
  address,
  wallet,
}: ConnectToTitleEscrowArgs): Promise<ConnectToTitleEscrowReturnType> => {
  const { isV3, contract: tokenRegistry } = await connectToTokenRegistry({ address, wallet });
  const titleEscrowAddress = await tokenRegistry.ownerOf(tokenId);
  return { isV3: isV3, contract: await connectToTitleEscrowFactory(isV3, titleEscrowAddress, wallet) };
};

export const connectToTitleEscrowFactory = async (
  isV3: boolean,
  titleEscrowAddress: string,
  wallet: Wallet | ConnectedSigner
): Promise<TitleEscrowInstanceType> => {
  if (isV3) {
    return await TitleEscrowCloneableFactory.connect(titleEscrowAddress, wallet);
  } else {
    return await TitleEscrowFactory.connect(titleEscrowAddress, wallet);
  }
};

interface validateEndorseChangeOwnerArgs {
  newHolder: string;
  newOwner: string;
  titleEscrow: TitleEscrowInstanceType;
}
export const validateEndorseChangeOwner = async ({
  newHolder,
  newOwner,
  titleEscrow,
}: validateEndorseChangeOwnerArgs): Promise<void> => {
  const beneficiary = await titleEscrow.beneficiary();
  const holder = await titleEscrow.holder();
  if (newOwner === beneficiary && newHolder === holder) {
    const error = "new owner and new holder addresses are the same as the current owner and holder addresses";
    signale.error(error);
    throw new Error(error);
  }
};

interface validateNominateChangeOwnerArgs {
  newOwner: string;
  titleEscrow: TitleEscrowInstanceType;
}
export const validateNominateChangeOwner = async ({
  newOwner,
  titleEscrow,
}: validateNominateChangeOwnerArgs): Promise<void> => {
  const beneficiary = await titleEscrow.beneficiary();
  if (newOwner === beneficiary) {
    const error = "new owner address is the same as the current owner address";
    signale.error(error);
    throw new Error(error);
  }
};

interface validateEndorseTransferOwnerArgs {
  approvedOwner: string | undefined;
  approvedHolder: string | undefined;
}
const GENESIS_ADDRESS = constants.AddressZero;
export const validateEndorseTransferOwner = ({
  approvedOwner,
  approvedHolder,
}: validateEndorseTransferOwnerArgs): void => {
  if (!approvedOwner || !approvedHolder || approvedOwner === GENESIS_ADDRESS || approvedHolder === GENESIS_ADDRESS) {
    const error = `there is no approved owner or holder or the approved owner or holder is equal to the genesis address: ${GENESIS_ADDRESS}`;
    signale.error(error);
    throw new Error(error);
  }
};
