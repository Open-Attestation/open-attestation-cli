import { GasOption, NetworkAndWalletSignerOption } from "../shared";

export type BaseTitleEscrowCommand = NetworkAndWalletSignerOption &
  GasOption & {
    tokenRegistry: string;
    tokenId: string;
  };
export type TitleEscrowTransferHolderCommand = BaseTitleEscrowCommand & {
  newHolder: string;
};

export type TitleEscrowEndorseTransferOfOwnersCommand = BaseTitleEscrowCommand & {
  newHolder: string;
  newOwner: string;
};

export type TitleEscrowNominateBeneficiaryCommand = BaseTitleEscrowCommand & {
  newBeneficiary: string;
};
