import { TitleEscrowNominateBeneficiaryCommand } from "../commands/title-escrow/title-escrow-command.type";
import {
  checkEndorseTransfer,
  checkFailure,
  deployTokenRegistry,
  mintNominatedToken,
  mintTokenRegistry,
} from "./utils/bootstrap";
import { generateEndorseTransferOwnerCommand } from "./utils/commands";
import { BurnAddress, network, owner, receiver } from "./utils/constants";
import { run } from "./utils/shell";

export const endorseTransfer = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  const defaultTransferHolder = {
    newBeneficiary: receiver.ethAddress,
    network: network,
    dryRun: false,
  };

  //"should be able to endorse transfer title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(
      owner.privateKey,
      defaultTransferHolder.newBeneficiary,
      tokenRegistryAddress
    );
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferHolder,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkEndorseTransfer(results);
  }

  //"should not be able to endorse un-nominated title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferHolder,
      tokenId,
      tokenRegistry,
      newBeneficiary: BurnAddress,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "");
  }
};
