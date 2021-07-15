import { TitleEscrowFactory, TradeTrustErc721Factory } from "@govtechsg/token-registry";
import { Wallet } from "ethers";
import signale from "signale";

interface ConnectToTitleEscrowArgs {
  tokenId: string;
  address: string;
  wallet: Wallet;
}

type TitleEscrowInstanceType = ReturnType<typeof TitleEscrowFactory.connect>;

export const connectToTitleEscrow = async ({
  tokenId,
  address,
  wallet,
}: ConnectToTitleEscrowArgs): Promise<TitleEscrowInstanceType> => {
  const tokenRegistry = await TradeTrustErc721Factory.connect(address, wallet);
  const titleEscrowAddress = await tokenRegistry.ownerOf(tokenId);
  const titleEscrow = await TitleEscrowFactory.connect(titleEscrowAddress, wallet);
  return titleEscrow;
};

interface validateEndorseOwnerArgs {
  newHolder: string;
  newOwner: string;
  titleEscrow: TitleEscrowInstanceType;
}
export const validateEndorseOwner = async ({
  newHolder,
  newOwner,
  titleEscrow,
}: validateEndorseOwnerArgs): Promise<void> => {
  const beneficiary = await titleEscrow.beneficiary();
  const holder = await titleEscrow.holder();
  if (newOwner === beneficiary && newHolder === holder) {
    const error = "new owner and new holder addresses are the same as the current owner and holder addresses";
    signale.error(error);
    throw new Error(error);
  }
};

interface validateNominateOwnerArgs {
  newOwner: string;
  titleEscrow: TitleEscrowInstanceType;
}
export const validateNominateOwner = async ({ newOwner, titleEscrow }: validateNominateOwnerArgs): Promise<void> => {
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
const GENESIS_ADDRESS = "0x0000000000000000000000000000000000000000";
export const validateEndorseTranserOwner = ({
  approvedOwner,
  approvedHolder,
}: validateEndorseTransferOwnerArgs): void => {
  if (!approvedOwner || !approvedHolder || approvedOwner === GENESIS_ADDRESS || approvedHolder === GENESIS_ADDRESS) {
    const error = `there is no approved owner or holder or the approved owner or holder is equal to the genesis address: ${GENESIS_ADDRESS}`;
    signale.error(error);
    throw new Error(error);
  }
};
