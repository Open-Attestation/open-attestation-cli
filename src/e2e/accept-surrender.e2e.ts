import {
  checkE2EFailure,
  checkE2ESurrenderAcceptSuccess,
  deployE2ETokenRegistry,
  mintSurrenderE2EToken,
  mintE2ETokenRegistry,
} from "./utils/helpers";
import { generateAcceptSurrenderCommand } from "./utils/commands";
import { BurnAddress, defaultRunParameters, EmptyTokenID, owner, receiver } from "./utils/constants";
import { getSigner, retrieveTitleEscrowOwner } from "./utils/contract-checks";
import { run } from "./utils/shell";

export const acceptE2Esurrender = async (): Promise<void> => {
  const tokenRegistryAddress = deployE2ETokenRegistry(owner.privateKey);
  // const errors: Error[] = [];
  const defaultTitleEscrow = {
    ...defaultRunParameters,
    beneficiary: owner.ethAddress,
    holder: owner.ethAddress,
  };

  //"should be able to accept-surrender title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand({ tokenRegistry, tokenId, ...defaultTitleEscrow }, owner.privateKey);
    const signer = await getSigner(defaultTitleEscrow.network, owner.privateKey);
    let titleEscrowOwner: string = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(titleEscrowOwner === tokenRegistry)) throw new Error(`!(titleEscrowOwner === tokenRegistry)`);

    const results = run(command);
    titleEscrowOwner = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(titleEscrowOwner === "0x000000000000000000000000000000000000dEaD"))
      throw new Error(`!(titleEscrowOwner === "0x000000000000000000000000000000000000dEaD")`);
    checkE2ESurrenderAcceptSuccess(results);
  }

  //"should not be able to accept surrender invalid title-escrow on token-registry"
  {
    const { tokenRegistry } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand(
      { tokenRegistry, tokenId: EmptyTokenID, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, "Unminted Token");
  }

  //"should not be able to accept surrender title-escrow on invalid token-registry"
  {
    const { tokenId } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand(
      { tokenRegistry: BurnAddress, tokenId, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, `Address ${BurnAddress} is not a valid Contract`);
  }

  //"should not be able to accept un-owned/held surrendered title-escrow on invalid token-registry"
  {
    const { tokenId } = mintSurrenderE2EToken(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand(
      { tokenRegistry: tokenRegistryAddress, tokenId, ...defaultTitleEscrow },
      receiver.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, "Wallet lack the rights for the transfer operation");
  }

  //"should not be able to accept un-surrendered title-escrow on token-registry"
  {
    const { tokenId } = mintE2ETokenRegistry(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand(
      { tokenRegistry: tokenRegistryAddress, tokenId, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkE2EFailure(results, "Title Escrow has not been surrendered");
  }
};
