import { TitleEscrowNominateBeneficiaryCommand } from "../commands/title-escrow/title-escrow-command.type";
import {
  burnE2EToken,
  changeHolderE2EToken,
  checkE2EEndorseBeneficiary,
  checkE2EFailure,
  defaultE2ETransferBeneficiary,
  deployE2ETokenRegistry,
  mintNominatedE2EToken,
  mintE2ETokenRegistry,
  surrenderE2EToken,
} from "./utils/helpers";
import { generateEndorseTransferOwnerCommand } from "./utils/commands";
import { owner, receiver, thirdParty } from "./utils/constants";
import { run } from "./utils/shell";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { BigNumber } from "ethers";

export const endorseE2ETransfer = async (): Promise<void> => {
  const tokenRegistryAddress = deployE2ETokenRegistry(owner.privateKey);

  //"should be able to endorse transfer title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
      owner.privateKey,
      receiver.ethAddress,
      tokenRegistryAddress
    );
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EEndorseBeneficiary(results);

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
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
      owner.privateKey,
      receiver.ethAddress,
      tokenRegistryAddress
    );
    changeHolderE2EToken(owner.privateKey, {
      ...defaultE2ETransferBeneficiary,
      tokenRegistry: tokenRegistry,
      tokenId: tokenId,
      newHolder: receiver.ethAddress,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to endorse transfer from nominee title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
      owner.privateKey,
      receiver.ethAddress,
      tokenRegistryAddress
    );
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, receiver.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to endorse surrendered title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(owner.privateKey, tokenRegistryAddress);
    surrenderE2EToken(owner.privateKey, {
      ...defaultE2ETransferBeneficiary,
      tokenRegistry,
      tokenId,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has already been surrendered");
  }

  // "should not be able to endorse burnt title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(owner.privateKey, tokenRegistryAddress);
    burnE2EToken(owner.privateKey, {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has already been shredded");
  }

  // "should not be able to endorse un-nominated title-escrow on token-registry";
  {
    const { tokenRegistry, tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Destination wallet has not been nominated");
  }

  // "should not be able to endorse transfer from holder title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintNominatedE2EToken(
      owner.privateKey,
      receiver.ethAddress,
      tokenRegistryAddress
    );
    changeHolderE2EToken(owner.privateKey, {
      ...defaultE2ETransferBeneficiary,
      tokenRegistry: tokenRegistry,
      tokenId: tokenId,
      newHolder: thirdParty.ethAddress,
    });
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ETransferBeneficiary,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, thirdParty.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }
};
