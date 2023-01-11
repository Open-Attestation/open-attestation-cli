import { TitleEscrowTransferHolderCommand } from "../commands/title-escrow/title-escrow-command.type";
import {
  changeHolderToken,
  checkChangeHolderSuccess,
  checkFailure,
  defaultTransferHolder,
  deployTokenRegistry,
  mintTokenRegistry,
} from "./utils/bootstrap";
import { generateChangeHolderCommand } from "./utils/commands";
import { BurnAddress, EmptyTokenID, owner, receiver } from "./utils/constants";
import { run } from "./utils/shell";

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

  //should not be able to transfer holder of invalid title-escrow on token-registry"
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
};
