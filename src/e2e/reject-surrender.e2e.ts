// import { deployTokenRegistry, mintSurrenderToken } from "./utils/utils";
import { run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, EmptyTokenID, owner, receiver } from "./utils/constants";
import { generateRejectSurrenderCommand } from "./utils/commands";
import { checkFailure, deployTokenRegistry, mintSurrenderToken, mintTokenRegistry } from "./utils/helpers";
import { checkSurrenderRejectSuccess } from "./utils/helpers";
import { getSigner, retrieveTitleEscrowOwner } from "./utils/contract-checks";
import { isAddress } from "web3-utils";

export const rejectSurrender = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  const defaultTitleEscrow = {
    ...defaultRunParameters,
    beneficiary: owner.ethAddress,
    holder: owner.ethAddress,
  };

  //"should be able to reject surrender title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const signer = await getSigner(defaultTitleEscrow.network, owner.privateKey);
    const command = generateRejectSurrenderCommand({ tokenRegistry, tokenId, ...defaultTitleEscrow }, owner.privateKey);

    let titleEscrowOwner: string = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(titleEscrowOwner === tokenRegistry)) throw new Error(`titleEscrowOwner === tokenRegistry`);
    const results = run(command);
    checkSurrenderRejectSuccess(results);
    titleEscrowOwner = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(isAddress(titleEscrowOwner) === true)) throw new Error(`isAddress(titleEscrowOwner) === true`);
    if (!(titleEscrowOwner !== tokenRegistry)) throw new Error(`titleEscrowOwner !== tokenRegistry`);
  }

  //"should not be able to reject surrender invalid title-escrow on token-registry"
  {
    const { tokenRegistry } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry, tokenId: EmptyTokenID, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkFailure(results, "Unminted Token");
  }

  //"should not be able to reject surrender title-escrow on invalid token-registry"
  {
    const { tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry: BurnAddress, tokenId, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkFailure(results, `Address ${BurnAddress} is not a valid Contract`);
  }

  //"should not be able to accept un-owned/held surrendered title-escrow on invalid token-registry"
  {
    const { tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry: tokenRegistryAddress, tokenId, ...defaultTitleEscrow },
      receiver.privateKey
    );
    const results = run(command);
    checkFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to accept un-surrendered title-escrow on token-registry"
  {
    const { tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry: tokenRegistryAddress, tokenId, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkFailure(results, "Title Escrow has not been surrendered");
  }
};
