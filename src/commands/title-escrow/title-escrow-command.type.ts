import { GasOption, NetworkAndKeyOption } from "../shared";

export interface BaseTitleEscrowCommand extends NetworkAndKeyOption, GasOption {
  address: string;
  tokenId: string;
}
export interface TitleEscrowChangeHolderCommand extends BaseTitleEscrowCommand {
  to: string;
}

export interface TitleEscrowEndorseChangeOfOwnerCommand extends BaseTitleEscrowCommand {
  newHolder: string;
  newOwner: string;
}

export interface TitleEscrowNominateChangeOfOwnerCommand extends BaseTitleEscrowCommand {
  newOwner: string;
}
