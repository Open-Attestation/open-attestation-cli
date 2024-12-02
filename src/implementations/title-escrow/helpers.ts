import {
  TitleEscrow,
  TitleEscrow__factory,
  TradeTrustToken,
  TradeTrustToken__factory,
} from "@tradetrust-tt/token-registry/contracts";
import { BytesLike, Wallet, constants, ethers } from "ethers";
import signale from "signale";
import { ConnectedSigner } from "../utils/wallet";
import { encrypt } from "@trustvc/trustvc";

interface ConnectToTitleEscrowArgs {
  tokenId: string;
  address: string;
  wallet: Wallet | ConnectedSigner;
}

export const connectToTitleEscrow = async ({
  tokenId,
  address,
  wallet,
}: ConnectToTitleEscrowArgs): Promise<TitleEscrow> => {
  const tokenRegistry: TradeTrustToken = await TradeTrustToken__factory.connect(address, wallet);
  const titleEscrowAddress = await tokenRegistry.ownerOf(tokenId);
  return await TitleEscrow__factory.connect(titleEscrowAddress, wallet);
};

interface validateEndorseChangeOwnerArgs {
  newHolder: string;
  newOwner: string;
  titleEscrow: TitleEscrow;
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

interface validateNominateBeneficiaryArgs {
  beneficiaryNominee: string;
  titleEscrow: TitleEscrow;
}
export const validateNominateBeneficiary = async ({
  beneficiaryNominee,
  titleEscrow,
}: validateNominateBeneficiaryArgs): Promise<void> => {
  const beneficiary = await titleEscrow.beneficiary();
  if (beneficiaryNominee === beneficiary) {
    const error = "new beneficiary address is the same as the current beneficiary address";
    signale.error(error);
    throw new Error(error);
  }
};

export const validatePreviousBeneficiary = async (titleEscrow: TitleEscrow): Promise<void> => {
  const prevBeneficiary = await titleEscrow.prevBeneficiary();
  if (prevBeneficiary === ethers.constants.AddressZero) {
    const error = "invalid rejection as previous beneficiary is not set";
    signale.error(error);
    throw new Error(error);
  }
};

export const validatePreviousHolder = async (titleEscrow: TitleEscrow): Promise<void> => {
  const prevHolder = await titleEscrow.prevHolder();
  if (prevHolder === ethers.constants.AddressZero) {
    const error = "invalid rejection as previous holder is not set";
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

export const validateAndEncryptRemark = (remark?: string, keyId?: string): BytesLike => {
  if (remark && remark.length > 120) {
    const error = `Remark length is more than 120 characters`;
    signale.error(error);
    throw new Error(error);
  }
  return encrypt(remark ?? " ", keyId ?? "");
  // return "0x1234";
};
