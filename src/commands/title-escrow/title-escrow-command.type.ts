import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type BaseTitleEscrowCommand = NetworkAndWalletSignerOption &
  GasOption & {
    tokenRegistry: string;
    tokenId: string;
  };
export type TitleEscrowChangeHolderCommand = BaseTitleEscrowCommand & {
  to: string;
};

export type TitleEscrowEndorseChangeOfOwnerCommand = BaseTitleEscrowCommand & {
  newHolder: string;
  newOwner: string;
};

export type TitleEscrowNominateBeneficiaryCommand = BaseTitleEscrowCommand & {
  newOwner: string;
};
