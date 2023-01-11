import { run } from "./utils/shell";
import { network, owner, receiver } from "./utils/constants";
import { TitleEscrowEndorseTransferOfOwnersCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateTransferOwnersCommand } from "./utils/commands";
import {
  checkEndorseOwner,
  checkFailure,
  deployTokenRegistry,
  mintNominatedToken,
  mintTokenRegistry,
} from "./utils/bootstrap";

// "endorse change owner title-escrow"
export const endorseChangeOwner = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  const defaultTransferOwners = {
    newOwner: receiver.ethAddress,
    newHolder: receiver.ethAddress,
    network: network,
    dryRun: false,
  };

  //should be able to endorse change owner title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(
      owner.privateKey,
      defaultTransferOwners.newOwner,
      tokenRegistryAddress
    );
    const transferOwners: TitleEscrowEndorseTransferOfOwnersCommand = {
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      ...defaultTransferOwners,
    };
    const command = generateTransferOwnersCommand(transferOwners, owner.privateKey);
    const results = run(command);
    const { beneficiary, holder, tokenId: tokenIdResult } = checkEndorseOwner(results);
    if (!(beneficiary === transferOwners.newOwner)) throw new Error(`beneficiary === transferOwners.newOwner`);
    if (!(holder === transferOwners.newHolder)) throw new Error(`holder === transferOwners.newHolder`);
    if (!(tokenIdResult === transferOwners.tokenId)) throw new Error(`tokenIdResult === transferOwners.tokenId`);
  }

  //should not be able to endorse change owner on un-nominated title-escrow"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferOwners: TitleEscrowEndorseTransferOfOwnersCommand = {
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      ...defaultTransferOwners,
    };
    const command = generateTransferOwnersCommand(transferOwners, owner.privateKey);
    const results = run(command);
    checkFailure(results, "");
  }
};
