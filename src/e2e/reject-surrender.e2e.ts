// import { deployTokenRegistry, mintSurrenderToken } from "./utils/utils";
import { extractLine, LineInfo, run } from "./utils/shell";
import { BurnAddress, EmptyTokenID, EndStatus, network, owner } from "./utils/constants";
import { generateRejectSurrenderCommand } from "./utils/commands";
import { checkFailure, deployTokenRegistry, mintSurrenderToken } from "./utils/bootstrap";
import { checkSurrenderRejectSuccess } from "./utils/bootstrap";
import { getSigner, retrieveTitleEscrowOwner } from "./utils/contract-checks";
import { isAddress } from "web3-utils";

export const rejectSurrender = async () => {
// describe("reject surrender title-escrow", () => {
  // jest.setTimeout(90000);

  
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  const defaultTitleEscrow = {
    beneficiary: owner.ethAddress,
    holder: owner.ethAddress,
    network: network,
    dryRun: false,
  };

  // it("should be able to reject surrender title-escrow on token-registry", async () => {
  {
    const { tokenRegistry, tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const signer = await getSigner(defaultTitleEscrow.network, owner.privateKey);
    const command = generateRejectSurrenderCommand({ tokenRegistry, tokenId, ...defaultTitleEscrow }, owner.privateKey);
    
    let titleEscrowOwner: string = await retrieveTitleEscrowOwner(
      signer,
      tokenRegistry,
      tokenId
    );
    if(!(titleEscrowOwner === tokenRegistry)) throw new Error(`titleEscrowOwner === tokenRegistry`);
    const results = run(command);
    checkSurrenderRejectSuccess(results);
    titleEscrowOwner = await retrieveTitleEscrowOwner(
      signer,
      tokenRegistry,
      tokenId
    );
    if(!(isAddress(titleEscrowOwner) === true)) throw new Error(`isAddress(titleEscrowOwner) === true`);
    if(!(titleEscrowOwner !== tokenRegistry)) throw new Error(`titleEscrowOwner !== tokenRegistry`);
  }

  // it("should not be able to reject surrender invalid title-escrow on token-registry", async () => {
  {
    const { tokenRegistry, tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand({ tokenRegistry, tokenId: EmptyTokenID, ...defaultTitleEscrow }, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }


  // it("should not be able to reject surrender title-escrow on invalid token-registry", async () => {
  {
    const { tokenRegistry, tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand({ tokenRegistry: BurnAddress, tokenId, ...defaultTitleEscrow }, owner.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  }

  // it.todo("should be fail when user without permission attempts reject surrender");
}
