import { run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, owner, receiver } from "./utils/constants";
import { BaseTitleEscrowCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateSurrenderCommand } from "./utils/commands";
import { getSigner, retrieveTitleEscrowOwner } from "./utils/contract-checks";
import { isAddress } from "web3-utils";
import { deployTokenRegistry, mintTokenRegistry, checkSurrenderSuccess, checkFailure } from "./utils/bootstrap";

const defaultTitleEscrow = {
  ...defaultRunParameters,
  beneficiary: owner.ethAddress,
  holder: owner.ethAddress,
};

export const surrender = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

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

  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId,
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
    const signer = await getSigner(surrenderTitleEscrow.network, owner.privateKey);
    const titleEscrowOwner: string = await retrieveTitleEscrowOwner(
      signer,
      surrenderTitleEscrow.tokenRegistry,
      surrenderTitleEscrow.tokenId
    );
    if (isAddress(titleEscrowOwner) !== true) {
      throw new Error(`(isAddress(titleEscrowOwner) !== true);`);
    }
    if (titleEscrowOwner === surrenderTitleEscrow.tokenRegistry) {
      throw new Error(`(titleEscrowOwner === surrenderTitleEscrow.tokenRegistry);`);
    }
  }

  {
    const { tokenRegistry } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  {
    const { tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry: BurnAddress,
      tokenId,
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  }
};
