import { extractLine, LineInfo, run } from "./utils/shell";
import { BurnAddress, EndStatus, network, owner, receiver } from "./utils/constants";
import { TitleEscrowNominateBeneficiaryCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateEndorseTransferOwnerCommand } from "./utils/commands";
import { checkEndorseTransfer, checkFailure, deployTokenRegistry, mintNominatedToken, mintToken, mintTokenRegistry } from "./utils/bootstrap";

// describe("endorse transfer title-escrow", () => {
export const endorseTransfer = async () => {
  // jest.setTimeout(90000);

  
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  const defaultTransferHolder = {
    newBeneficiary: receiver.ethAddress,
    network: network,
    dryRun: false,
  };

  // it("should be able to endorse transfer title-escrow on token-registry", async () => {
  {
    const { tokenRegistry, tokenId } = mintNominatedToken(
      owner.privateKey,
      defaultTransferHolder.newBeneficiary,
      tokenRegistryAddress
    );
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferHolder,
      tokenId,
      tokenRegistry,
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkEndorseTransfer(results);
  }


  // it("should not be able to endorse un-nominated title-escrow on token-registry", async () => {
  {
    const { tokenRegistry, tokenId } = mintTokenRegistry(
      owner.privateKey,
      tokenRegistryAddress
    );
    const transferHolder: TitleEscrowNominateBeneficiaryCommand = {
      ...defaultTransferHolder,
      tokenId,
      tokenRegistry,
      newBeneficiary: BurnAddress
    };

    const command = generateEndorseTransferOwnerCommand(transferHolder, owner.privateKey);
    const results = run(command);
    checkFailure(results, "");
  }

}
