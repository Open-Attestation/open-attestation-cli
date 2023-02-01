import { run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, owner, receiver, thirdParty } from "./utils/constants";
import { TitleEscrowNominateBeneficiaryCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateNominateCommand } from "./utils/commands";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import {
  changeHolderE2EToken,
  checkE2EFailure,
  checkE2ENominateSuccess,
  defaultE2ENominateBeneficiary,
  deployE2ETokenRegistry,
  mintE2ETokenRegistry,
} from "./utils/helpers";

export const nominate = async (): Promise<void> => {
  const tokenRegistryAddress = deployE2ETokenRegistry(owner.privateKey);

  //"should be able to nominate title-escrow on token-registry"
  {
    const { tokenId, tokenRegistry } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateNominateCommand(nominateParameter, owner.privateKey);
    const results = run(command);
    const nominateInfo = checkE2ENominateSuccess(results);
    if (!(nominateInfo.tokenId === nominateParameter.tokenId))
      throw new Error(`nominateInfo.tokenId === nominateParameter.tokenId`);
    if (!(nominateInfo.nominee === nominateParameter.newBeneficiary))
      throw new Error(`nominateInfo.nominee === nominateParameter.newBeneficiary`);
    const signer = await getSigner(nominateParameter.network, owner.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      nominateParameter.tokenRegistry,
      nominateParameter.tokenId
    );
    if (!(titleEscrowInfo.nominee === nominateParameter.newBeneficiary))
      throw new Error(`titleEscrowInfo.nominee === nominateParameter.newBeneficiary`);
  }

  //"should be able to cancel nomination of title-escrow on token-registry"
  {
    const { tokenId, tokenRegistry } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferReceiverNominee: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ENominateBeneficiary,
      tokenId,
      tokenRegistry,
    };
    const receiverNominateCommand = generateNominateCommand(transferReceiverNominee, owner.privateKey);
    const receiverNominateResults = run(receiverNominateCommand);
    checkE2ENominateSuccess(receiverNominateResults);
    const transferBurnNominee = {
      ...transferReceiverNominee,
      newBeneficiary: BurnAddress,
    };
    const command = generateNominateCommand(transferBurnNominee, owner.privateKey);
    const results = run(command);
    const nominateInfo = checkE2ENominateSuccess(results);
    if (!(nominateInfo.tokenId === transferBurnNominee.tokenId))
      throw new Error(`nominateInfo.tokenId === transferBurnNominee.tokenId`);
    if (!(nominateInfo.nominee === transferBurnNominee.newBeneficiary))
      throw new Error(`nominateInfo.nominee === transferBurnNominee.newBeneficiary`);

    const signer = await getSigner(transferBurnNominee.network, owner.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      transferBurnNominee.tokenRegistry,
      transferBurnNominee.tokenId
    );
    if (!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
  }

  //"should not be able to nominate self"
  {
    const { tokenId, tokenRegistry } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ENominateBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: owner.ethAddress,
    };
    const command = generateNominateCommand(nominateParameter, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Destination wallet already has the rights as beneficiary");
  }

  //"should not be able to nominate unowned token"
  {
    const { tokenId, tokenRegistry } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ENominateBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };
    const command = generateNominateCommand(nominateParameter, receiver.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to nominate token as holder"
  {
    const { tokenId, tokenRegistry } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    changeHolderE2EToken(owner.privateKey, {
      ...defaultE2ENominateBeneficiary,
      newHolder: receiver.ethAddress,
      tokenId,
      tokenRegistry,
    });
    const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ENominateBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: thirdParty.ethAddress,
    };
    const command = generateNominateCommand(nominateParameter, receiver.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to nominate non-existent token"
  {
    const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ENominateBeneficiary,
      tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      tokenRegistry: tokenRegistryAddress,
      newBeneficiary: receiver.ethAddress,
    };
    const command = generateNominateCommand(nominateParameter, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Unminted Token");
  }

  // "should not be able to nominate non-existent token registry"
  {
    const nominateParameter: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultE2ENominateBeneficiary,
      tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      tokenRegistry: "0x0000000000000000000000000000000000000000",
      newBeneficiary: receiver.ethAddress,
    };
    const command = generateNominateCommand(nominateParameter, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, `Address ${BurnAddress} is not a valid Contract`);
  }
};
