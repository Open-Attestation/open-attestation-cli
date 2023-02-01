import { run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, owner, receiver, thirdParty } from "./utils/constants";
import { TitleEscrowEndorseTransferOfOwnersCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateTransferOwnersCommand } from "./utils/commands";
import {
  burnE2EToken,
  changeHolderE2EToken,
  checkE2EEndorseOwner,
  checkE2EFailure,
  deployE2ETokenRegistry,
  mintNominatedE2EToken,
  mintE2ETokenRegistry,
  surrenderE2EToken,
} from "./utils/helpers";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { BigNumber } from "ethers";

// "endorse change owner title-escrow"
export const endorseE2EChangeOwner = async (): Promise<void> => {
  const tokenRegistryAddress = deployE2ETokenRegistry(owner.privateKey);

  const defaultTransferOwners = {
    ...defaultRunParameters,
    newOwner: receiver.ethAddress,
    newHolder: receiver.ethAddress,
  };

  //should be able to endorse change owner title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
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
    const { beneficiary, holder, tokenId: tokenIdResult } = checkE2EEndorseOwner(results);
    if (!(beneficiary === transferOwners.newOwner)) throw new Error(`beneficiary === transferOwners.newOwner`);
    if (!(holder === transferOwners.newHolder)) throw new Error(`holder === transferOwners.newHolder`);
    if (!(tokenIdResult === transferOwners.tokenId)) throw new Error(`tokenIdResult === transferOwners.tokenId`);

    const signer = await getSigner(transferOwners.network, receiver.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(signer, transferOwners.tokenRegistry, transferOwners.tokenId);
    if (!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if (!(titleEscrowInfo.beneficiary === transferOwners.newOwner))
      throw new Error(`titleEscrowInfo.beneficiary === transferOwners.beneficiary`);
    if (!(titleEscrowInfo.holder === transferOwners.newHolder))
      throw new Error(`titleEscrowInfo.holder === transferOwners.holder`);
    if (!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if (!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if (!(titleEscrowInfo.registry === transferOwners.tokenRegistry))
      throw new Error(`titleEscrowInfo.registry === transferOwners.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(transferOwners.tokenId));
    if (!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  //"should not be able to endorse change owner from just beneficiary title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
      owner.privateKey,
      receiver.ethAddress,
      tokenRegistryAddress
    );
    changeHolderE2EToken(owner.privateKey, {
      ...defaultTransferOwners,
      tokenRegistry: tokenRegistry,
      tokenId: tokenId,
      newHolder: receiver.ethAddress,
    });
    const transferHolder: TitleEscrowEndorseTransferOfOwnersCommand = {
      ...defaultTransferOwners,
      tokenId,
      tokenRegistry,
    };

    const command = generateTransferOwnersCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to endorse change owner from nominee title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
      owner.privateKey,
      receiver.ethAddress,
      tokenRegistryAddress
    );
    const transferHolder: TitleEscrowEndorseTransferOfOwnersCommand = {
      ...defaultTransferOwners,
      tokenId,
      tokenRegistry,
    };

    const command = generateTransferOwnersCommand(transferHolder, receiver.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to endorse surrendered title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(owner.privateKey, tokenRegistryAddress);
    surrenderE2EToken(owner.privateKey, {
      ...defaultTransferOwners,
      tokenRegistry,
      tokenId,
    });
    const transferHolder: TitleEscrowEndorseTransferOfOwnersCommand = {
      ...defaultTransferOwners,
      tokenId,
      tokenRegistry,
    };

    const command = generateTransferOwnersCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has already been surrendered");
  }

  //"should not be able to endorse burnt title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(owner.privateKey, tokenRegistryAddress);
    burnE2EToken(owner.privateKey, {
      ...defaultTransferOwners,
      tokenId,
      tokenRegistry,
    });
    const transferHolder: TitleEscrowEndorseTransferOfOwnersCommand = {
      ...defaultTransferOwners,
      tokenId,
      tokenRegistry,
    };

    const command = generateTransferOwnersCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has already been shredded");
  }

  //"should not be able to endorse change owner on un-nominated title-escrow"
  {
    const { tokenRegistry, tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferOwners: TitleEscrowEndorseTransferOfOwnersCommand = {
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      ...defaultTransferOwners,
    };
    const command = generateTransferOwnersCommand(transferOwners, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Destination wallet has not been nominated");
  }

  //"should not be able to endorse change owner from holder title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
      owner.privateKey,
      receiver.ethAddress,
      tokenRegistryAddress
    );
    changeHolderE2EToken(owner.privateKey, {
      ...defaultTransferOwners,
      tokenRegistry: tokenRegistry,
      tokenId: tokenId,
      newHolder: thirdParty.ethAddress,
    });
    const transferHolder: TitleEscrowEndorseTransferOfOwnersCommand = {
      ...defaultTransferOwners,
      tokenId,
      tokenRegistry,
    };

    const command = generateTransferOwnersCommand(transferHolder, thirdParty.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }
};
