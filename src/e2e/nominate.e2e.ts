import { run } from "./utils/shell";
import {
  BurnAddress,
  defaultRunParameters,
  owner,
  receiver,
} from "./utils/constants";
import { TitleEscrowNominateBeneficiaryCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateNominateCommand } from "./utils/commands";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { checkFailure, checkNominateSuccess, defaultNominateBeneficiary, deployTokenRegistry, mintTokenRegistry } from "./utils/bootstrap";

export const nominate = async () => {
// describe("nominate title-escrow", () => {
  // jest.setTimeout(90000);

  
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  // it("should be able to nominate title-escrow on token-registry", async () => {
  {
    const { tokenId, tokenRegistry } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateNominateCommand(transferHolder, owner.privateKey);
    const results = run(command);
    const nominateInfo = checkNominateSuccess(results);
    if(!(nominateInfo.tokenId === transferHolder.tokenId)) throw new Error (`nominateInfo.tokenId === transferHolder.tokenId`);
    if(!(nominateInfo.nominee === transferHolder.newBeneficiary)) throw new Error (`nominateInfo.nominee === transferHolder.newBeneficiary`);
    const signer = await getSigner(transferHolder.network, owner.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(signer, transferHolder.tokenRegistry, transferHolder.tokenId);
    if(!(titleEscrowInfo.nominee === transferHolder.newBeneficiary)) throw new Error (`titleEscrowInfo.nominee === transferHolder.newBeneficiary`);
  }

  // it("should be able to cancel nomination of title-escrow on token-registry", async () => {
  {
    const { tokenId, tokenRegistry } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultNominateBeneficiary,
      tokenId,
      tokenRegistry,
    };
    let results = run(generateNominateCommand(transferHolder, owner.privateKey));
    transferHolder.newBeneficiary = BurnAddress;
    const command = generateNominateCommand(transferHolder, owner.privateKey);
    results = run(command);
    const nominateInfo = checkNominateSuccess(results);
    if(!(nominateInfo.tokenId === transferHolder.tokenId)) throw new Error (`nominateInfo.tokenId === transferHolder.tokenId`);
    if(!(nominateInfo.nominee === transferHolder.newBeneficiary)) throw new Error (`nominateInfo.nominee === transferHolder.newBeneficiary`);

    const signer = await getSigner(transferHolder.network, owner.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(signer, transferHolder.tokenRegistry, transferHolder.tokenId);
    if(!(titleEscrowInfo.nominee === BurnAddress)) throw new Error (`titleEscrowInfo.nominee === BurnAddress`);
  }

  // it("should not be able to nominate self", async () => {
  {
    const { tokenId, tokenRegistry } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultNominateBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: owner.ethAddress,
    };
    const command = generateNominateCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "new beneficiary address is the same as the current beneficiary address");
  }

  // it("should not be able to nominate unowned token", async () => {
  {
    const { tokenId, tokenRegistry } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultNominateBeneficiary,
      tokenId,
      tokenRegistry,
      newBeneficiary: receiver.ethAddress,
    };
    const command = generateNominateCommand(transferHolder, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  // it("should not be able to nominate non-existent token", async () => {
  {
    const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultNominateBeneficiary,
      tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      tokenRegistry: tokenRegistryAddress,
      newBeneficiary: receiver.ethAddress,
    };
    const command = generateNominateCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  // it("should not be able to nominate non-existent token registry", async () => {
  {
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultNominateBeneficiary,
      tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      tokenRegistry: "0x0000000000000000000000000000000000000000",
      newBeneficiary: receiver.ethAddress,
    };
    const command = generateNominateCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  }
}
