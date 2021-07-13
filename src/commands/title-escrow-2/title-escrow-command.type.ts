import { GasOption, NetworkAndKeyOption } from "../shared";

export interface TitleEscrowSurrenderDocumentCommand extends NetworkAndKeyOption, GasOption {
  tokenRegistry: string;
  tokenId: string;
}
