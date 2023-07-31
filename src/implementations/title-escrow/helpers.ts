import { TitleEscrow } from "@govtechsg/token-registry/contracts";
import { constants } from "ethers";
import signale from "signale";

export { connectToTitleEscrow, connectToTitleEscrowAddress } from "../utils/connect";

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
