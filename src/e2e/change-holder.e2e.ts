import { TitleEscrowTransferHolderCommand } from "../commands/title-escrow/title-escrow-command.type";
import {
  changeHolderToken,
  checkChangeHolderSuccess,
  checkFailure,
  defaultTransferHolder,
  deployTokenRegistry,
  mintBurntToken,
  mintSurrenderToken,
  mintTokenRegistry,
} from "./utils/helpers";
import { generateChangeHolderCommand } from "./utils/commands";
import { BurnAddress, EmptyTokenID, owner, receiver } from "./utils/constants";
import { run } from "./utils/shell";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { BigNumber } from "ethers";

// "transfer holder title-escrow"
export const changeHolder = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  //should be able to transfer holder title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      ...defaultTransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkChangeHolderSuccess(results);

    const signer = await getSigner(transferHolder.network, receiver.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(signer, transferHolder.tokenRegistry, transferHolder.tokenId);
    if (!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if (!(titleEscrowInfo.holder === transferHolder.newHolder))
      throw new Error(`titleEscrowInfo.holder === transferHolder.holder`);
    if (!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if (!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if (!(titleEscrowInfo.registry === transferHolder.tokenRegistry))
      throw new Error(`titleEscrowInfo.registry === transferHolder.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(transferHolder.tokenId));
    if (!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  //holder should be able to transfer holder of title-escrow"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    // Transfer Holder to Receiver
    const initialHolder: TitleEscrowTransferHolderCommand = {
      ...defaultTransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: receiver.ethAddress,
    };
    changeHolderToken(owner.privateKey, initialHolder);
    // Transfer Holder to Receiver
    // Holder attempts to transfer Holder with permission
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultTransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, receiver.privateKey);
    // Holder attempts to transfer Holder with permission
    const results = run(command);
    checkChangeHolderSuccess(results);
  }

  //should not be able to transfer holder of invalid title-escrow on token-registry"
  {
    const { tokenRegistry } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: EmptyTokenID,
      tokenRegistry: tokenRegistry,
      ...defaultTransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  //should not be able to transfer holder of title-escrow on invalid token-registry"
  {
    const { tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: tokenId,
      tokenRegistry: BurnAddress,
      ...defaultTransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  }

  //beneficiary should not be able to transfer holder of title-escrow"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    // Transfer Holder to Receiver
    const initialHolder: TitleEscrowTransferHolderCommand = {
      ...defaultTransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: receiver.ethAddress,
    };
    changeHolderToken(owner.privateKey, initialHolder);
    // Transfer Holder to Receiver
    // Beneficiary attempts to transfer Holder without permission
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultTransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    // Beneficiary attempts to transfer Holder without permission
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  //should not be able to transfer holder of surrendered title-escrow"
  {
    console.info("Skipped Test");
    console.info("should not be able to transfer holder of surrendered title-escrow");
    return;
    const { tokenRegistry, tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultTransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  //should not be able to transfer holder of burnt title-escrow"
  {
    console.info("Skipped Test");
    console.info("should not be able to transfer holder of burnt title-escrow");
    return;
    const { tokenRegistry, tokenId } = mintBurntToken(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultTransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }
};
