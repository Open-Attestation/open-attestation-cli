import { checkFailure, checkSurrenderAcceptSuccess, deployTokenRegistry, mintSurrenderToken } from "./utils/bootstrap";
import { generateAcceptSurrenderCommand } from "./utils/commands";
import { BurnAddress, EmptyTokenID, network, owner } from "./utils/constants";
import { getSigner, retrieveTitleEscrowOwner } from "./utils/contract-checks";
import { run } from "./utils/shell";

export const acceptSurrender = async (): Promise<void> => {
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);
  // const errors: Error[] = [];
  const defaultTitleEscrow = {
    beneficiary: owner.ethAddress,
    holder: owner.ethAddress,
    network: network,
    dryRun: false,
  };

  //"should be able to accept-surrender title-escrow on token-registry"
  {
    const { tokenRegistry, tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand({ tokenRegistry, tokenId, ...defaultTitleEscrow }, owner.privateKey);
    const signer = await getSigner(defaultTitleEscrow.network, owner.privateKey);
    let titleEscrowOwner: string = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(titleEscrowOwner === tokenRegistry)) throw new Error(`!(titleEscrowOwner === tokenRegistry)`);

    const results = run(command);
    titleEscrowOwner = await retrieveTitleEscrowOwner(signer, tokenRegistry, tokenId);
    if (!(titleEscrowOwner === "0x000000000000000000000000000000000000dEaD"))
      throw new Error(`!(titleEscrowOwner === "0x000000000000000000000000000000000000dEaD")`);
    checkSurrenderAcceptSuccess(results);
  }

  //"should not be able to accept surrender invalid title-escrow on token-registry"
  {
    const { tokenRegistry } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand(
      { tokenRegistry, tokenId: EmptyTokenID, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  //"should not be able to accept surrender title-escrow on invalid token-registry"
  {
    const { tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateAcceptSurrenderCommand(
      { tokenRegistry: BurnAddress, tokenId, ...defaultTitleEscrow },
      owner.privateKey
    );
    const results = run(command);
    checkFailure(results, "null");
  }
};

// npm run dev -- title-escrow accept-surrendered --token-registry 0x0000000000000000000000000000000000000000 --tokenId 0xf32907ec66ac258f058eae34d76b160b0ca520b5c613ca93ae6bb22a8f9c451f --network local -k 0xe82294532bcfcd8e0763ee5cef194f36f00396be59b94fb418f5f8d83140d9a7
