import { run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, owner, receiver } from "./utils/constants";
import { BaseTitleEscrowCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateSurrenderCommand } from "./utils/commands";
import { getSigner, retrieveTitleEscrowOwner } from "./utils/contract-checks";
import { isAddress } from "web3-utils";
import {
  deployTokenRegistry,
  mintTokenRegistry,
  checkSurrenderSuccess,
  checkFailure,
  changeHolderToken,
  nominateAndEndorseBeneficiary,
} from "./utils/helpers";

const defaultTitleEscrow = {
  ...defaultRunParameters,
  beneficiary: owner.ethAddress,
  holder: owner.ethAddress,
};

export const surrender = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  // "should be able to surrender title-escrow"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId,
    };
    const signer = await getSigner(surrenderTitleEscrow.network, owner.privateKey);
    let titleEscrowOwner: string = await retrieveTitleEscrowOwner(
      signer,
      surrenderTitleEscrow.tokenRegistry,
      surrenderTitleEscrow.tokenId
    );
    if (isAddress(titleEscrowOwner) !== true) {
      throw new Error(`(isAddress(titleEscrowOwner) === true);`);
    }
    if (titleEscrowOwner === surrenderTitleEscrow.tokenRegistry) {
      throw new Error(`(titleEscrowOwner === surrenderTitleEscrow.tokenRegistry);`);
    }
    const command = generateSurrenderCommand(surrenderTitleEscrow, owner.privateKey);
    const results = run(command);
    const surrenderResults = checkSurrenderSuccess(results);
    if (surrenderResults.tokenId !== surrenderTitleEscrow.tokenId) {
      throw new Error(`(surrenderResults.tokenId !== surrenderTitleEscrow.tokenId);`);
    }
    titleEscrowOwner = await retrieveTitleEscrowOwner(
      signer,
      surrenderTitleEscrow.tokenRegistry,
      surrenderTitleEscrow.tokenId
    );
    if (titleEscrowOwner !== surrenderTitleEscrow.tokenRegistry) {
      throw new Error(`(titleEscrowOwner !== surrenderTitleEscrow.tokenRegistry);`);
    }
  }

  // "Should not be able to surrender unowned title-escrow"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId,
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "Wallet lack the rights for the transfer operation");
  }

  // "Should not be able to surrender title-escrow as beneficiary"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId,
    };
    nominateAndEndorseBeneficiary(owner.privateKey, {
      ...defaultTitleEscrow,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    });
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "Wallet lack the rights for the transfer operation");
  }

  // "Should not be able to surrender title-escrow as holder"
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId,
    };
    changeHolderToken(owner.privateKey, {
      ...defaultTitleEscrow,
      tokenId,
      tokenRegistry,
      newHolder: receiver.ethAddress,
    });
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "Wallet lack the rights for the transfer operation");
  }

  // "Should not be able to surrender invalid title-escrow"
  {
    const { tokenRegistry } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "Unminted Token");
  }

  // "Should not be able to surrender invalid token-registry"
  {
    const { tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry: BurnAddress,
      tokenId,
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, `Address ${BurnAddress} is not a valid Contract`);
  }
};
