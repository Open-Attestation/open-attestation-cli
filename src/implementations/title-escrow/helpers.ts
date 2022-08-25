import { TitleEscrowCloneable, TitleEscrowCloneableFactory } from "@govtechsg/token-registry";
import { Wallet, constants } from "ethers";
import signale from "signale";
import { connectToTokenRegistry } from "../token-registry/helpers";
import { ConnectedSigner } from "../utils/wallet";

interface ConnectToTitleEscrowArgs {
  tokenId: string;
  address: string;
  wallet: Wallet | ConnectedSigner;
}

export const connectToTitleEscrow = async ({
  tokenId,
  address,
  wallet,
}: ConnectToTitleEscrowArgs): Promise<TitleEscrowCloneable> => {
  const tokenRegistry = await connectToTokenRegistry({ address, wallet });
  const titleEscrowAddress = await tokenRegistry.ownerOf(tokenId);
  return await connectToTitleEscrowFactory(titleEscrowAddress, wallet);
};

export const connectToTitleEscrowFactory = async (
  titleEscrowAddress: string,
  wallet: Wallet | ConnectedSigner
): Promise<TitleEscrowCloneable> => {
    return await TitleEscrowCloneableFactory.connect(titleEscrowAddress, wallet);
};

interface validateEndorseChangeOwnerArgs {
  newHolder: string;
  newOwner: string;
  titleEscrow: TitleEscrowCloneable;
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
  titleEscrow: TitleEscrowCloneable;
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
