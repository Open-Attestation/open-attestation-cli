import { TitleEscrowTransferHolderCommand } from "../commands/title-escrow/title-escrow-command.type";
import {
  changeHolderE2EToken,
  checkE2EChangeHolderSuccess,
  checkE2EFailure,
  defaultE2ETransferHolder,
  deployE2ETokenRegistry,
  mintBurntE2EToken,
  mintSurrenderE2EToken,
  mintE2ETokenRegistry,
} from "./utils/helpers";
import { generateChangeHolderCommand } from "./utils/commands";
import { BurnAddress, EmptyTokenID, owner, receiver } from "./utils/constants";
import { run } from "./utils/shell";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { BigNumber } from "ethers";

// "transfer holder title-escrow"
export const changeHolder = async (): Promise<void> => {
  const tokenRegistryAddress = deployE2ETokenRegistry(owner.privateKey);

  //should be able to transfer holder title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      ...defaultE2ETransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EChangeHolderSuccess(results);

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
    const { tokenRegistry, tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    // Transfer Holder to Receiver
    const initialHolder: TitleEscrowTransferHolderCommand = {
      ...defaultE2ETransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: receiver.ethAddress,
    };
    changeHolderE2EToken(owner.privateKey, initialHolder);
    // Transfer Holder to Receiver
    // Holder attempts to transfer Holder with permission
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultE2ETransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, receiver.privateKey);
    // Holder attempts to transfer Holder with permission
    const results = run(command);
    checkE2EChangeHolderSuccess(results);
  }

  //should not be able to transfer holder of invalid title-escrow on token-registry"
  {
    const { tokenRegistry } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: EmptyTokenID,
      tokenRegistry: tokenRegistry,
      ...defaultE2ETransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Unminted Token");
  }

  //should not be able to transfer holder of title-escrow on invalid token-registry"
  {
    const { tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      tokenId: tokenId,
      tokenRegistry: BurnAddress,
      ...defaultE2ETransferHolder,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, `Address ${BurnAddress} is not a valid Contract`);
  }

  //beneficiary should not be able to transfer holder of title-escrow"
  {
    const { tokenRegistry, tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    // Transfer Holder to Receiver
    const initialHolder: TitleEscrowTransferHolderCommand = {
      ...defaultE2ETransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: receiver.ethAddress,
    };
    changeHolderE2EToken(owner.privateKey, initialHolder);
    // Transfer Holder to Receiver
    // Beneficiary attempts to transfer Holder without permission
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultE2ETransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    // Beneficiary attempts to transfer Holder without permission
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  // should not be able to transfer holder of surrendered title-escrow"
  {
    const { tokenRegistry, tokenId } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultE2ETransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has already been surrendered");
  }

  //should not be able to transfer holder of burnt title-escrow"
  {
    const { tokenRegistry, tokenId } = mintBurntE2EToken(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowTransferHolderCommand = {
      ...defaultE2ETransferHolder,
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      newHolder: owner.ethAddress,
    };
    const command = generateChangeHolderCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has already been shredded");
  }
};
