import { GasOption, NetworkAndKeyOption } from "../shared";

export interface TitleEscrowChangeHolderCommand extends NetworkAndKeyOption, GasOption {
  address: string;
  to: string;
  tokenId: string;
}
export interface TitleEscrowSurrenderDocumentCommand extends NetworkAndKeyOption, GasOption {
  tokenRegistry: string;
  tokenId: string;
}
