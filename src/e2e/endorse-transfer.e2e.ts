import { TitleEscrowNominateBeneficiaryCommand } from "../commands/title-escrow/title-escrow-command.type";
import {
  burnToken,
  changeHolderToken,
  checkEndorseBeneficiary,
  checkFailure,
  defaultTransferBeneficiary,
  deployTokenRegistry,
  mintNominatedToken,
  mintTokenRegistry,
  surrenderToken,
} from "./utils/helpers";
import { generateEndorseTransferOwnerCommand } from "./utils/commands";
import { owner, receiver, thirdParty } from "./utils/constants";
import { run } from "./utils/shell";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { BigNumber } from "ethers";

export const endorseTransfer = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  //"should be able to endorse transfer title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(owner.privateKey, receiver.ethAddress, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkEndorseBeneficiary(results);

    const signer = await getSigner(transferHolder.network, receiver.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(signer, transferHolder.tokenRegistry, transferHolder.tokenId);
    if (!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if (!(titleEscrowInfo.beneficiary === transferHolder.newBeneficiary))
      throw new Error(`titleEscrowInfo.beneficiary === transferHolder.beneficiary`);
    if (!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if (!(titleEscrowInfo.registry === transferHolder.tokenRegistry))
      throw new Error(`titleEscrowInfo.registry === transferHolder.tokenRegistry`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(transferHolder.tokenId));
    if (!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  //"should not be able to endorse transfer from just beneficiary title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(owner.privateKey, receiver.ethAddress, tokenRegistryAddress);
    changeHolderToken(owner.privateKey, {
      ...defaultTransferBeneficiary,
      tokenRegistry: tokenRegistry,
      tokenId: tokenId,
      newHolder: receiver.ethAddress,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to endorse transfer from nominee title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(owner.privateKey, receiver.ethAddress, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to endorse surrendered title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(owner.privateKey, tokenRegistryAddress);
    surrenderToken(owner.privateKey, {
      ...defaultTransferBeneficiary,
      tokenRegistry,
      tokenId,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "Title Escrow has already been surrendered");
  }

  // "should not be able to endorse burnt title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(owner.privateKey, tokenRegistryAddress);
    burnToken(owner.privateKey, {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "Title Escrow has already been shredded");
  }

  // "should not be able to endorse un-nominated title-escrow on token-registry";
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "Destination wallet has not been nominated");
  }

  // "should not be able to endorse transfer from holder title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(owner.privateKey, receiver.ethAddress, tokenRegistryAddress);
    changeHolderToken(owner.privateKey, {
      ...defaultTransferBeneficiary,
      tokenRegistry: tokenRegistry,
      tokenId: tokenId,
      newHolder: thirdParty.ethAddress,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, thirdParty.privateKey);
    const results = run(command);
    checkFailure(results, "Wallet lack the rights for the transfer operation");
  }
};
