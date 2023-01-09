import { extractLine, LineInfo, run } from "./utils/shell";
import { BurnAddress, EmptyTokenID, EndStatus, network, owner, receiver } from "./utils/constants";
import { TitleEscrowTransferHolderCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateChangeHolderCommand } from "./utils/commands";
import { checkFailure, deployTokenRegistry, mintTokenRegistry } from "./utils/bootstrap";
import { changeHolderToken, checkChangeHolderSuccess, defaultTransferHolder } from "./utils/bootstrap";

// describe("transfer holder title-escrow", () => {
export const changeHolder = async () => {
  // jest.setTimeout(90000);

  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  // it("should be able to transfer holder title-escrow on token-registry", async () => {
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


  // it("holder should be able to transfer holder of title-escrow", async () => {
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

  // it("should not be able to transfer holder of invalid title-escrow on token-registry", async () => {
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: EmptyTokenID,
      tokenRegistry: tokenRegistry,
      ...defaultTransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }


  // it("should not be able to transfer holder of invalid title-escrow on token-registry", async () => {
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: tokenId,
      tokenRegistry: BurnAddress,
      ...defaultTransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  }

  // it("beneficiary should not be able to transfer holder of title-escrow", async () => {
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
