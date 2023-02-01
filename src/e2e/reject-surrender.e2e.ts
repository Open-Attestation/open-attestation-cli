// import { deployTokenRegistry, mintSurrenderToken } from "./utils/utils";
import { run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, EmptyTokenID, owner, receiver } from "./utils/constants";
import { generateRejectSurrenderCommand } from "./utils/commands";
import { checkE2EFailure, deployE2ETokenRegistry, mintSurrenderE2EToken, mintE2ETokenRegistry } from "./utils/helpers";
import { checkE2ESurrenderRejectSuccess } from "./utils/helpers";
import { getSigner, retrieveTitleEscrowOwner } from "./utils/contract-checks";
import { isAddress } from "web3-utils";

export const rejectSurrender = async (): Promise<void> => {
  const tokenRegistryAddress = deployE2ETokenRegistry(owner.privateKey);

  const defaultTitleEscrow = {
    ...defaultRunParameters,
    beneficiary: owner.ethAddress,
    holder: owner.ethAddress,
  };

  //"should be able to reject surrender title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const signer = await getSigner(defaultTitleEscrow.network, owner.privateKey);
    const command = generateRejectSurrenderCommand({ tokenRegistry, tokenId, ...defaultTitleEscrow }, owner.privateKey);

    let titleEscrowOwner: string = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(titleEscrowOwner === tokenRegistry)) throw new Error(`titleEscrowOwner === tokenRegistry`);
    const results = run(command);
    checkE2ESurrenderRejectSuccess(results);
    titleEscrowOwner = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(isAddress(titleEscrowOwner) === true)) throw new Error(`isAddress(titleEscrowOwner) === true`);
    if (!(titleEscrowOwner !== tokenRegistry)) throw new Error(`titleEscrowOwner !== tokenRegistry`);
  }

  //"should not be able to reject surrender invalid title-escrow on token-registry"
  {
    const { tokenRegistry } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry, tokenId: EmptyTokenID, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, "Unminted Token");
  }

  //"should not be able to reject surrender title-escrow on invalid token-registry"
  {
    const { tokenId } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry: BurnAddress, tokenId, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, `Address ${BurnAddress} is not a valid Contract`);
  }

  //"should not be able to accept un-owned/held surrendered title-escrow on invalid token-registry"
  {
    const { tokenId } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry: tokenRegistryAddress, tokenId, ...defaultTitleEscrow },
      receiver.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to accept un-surrendered title-escrow on token-registry"
  {
    const { tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand(
      { tokenRegistry: tokenRegistryAddress, tokenId, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has not been surrendered");
  }
};
