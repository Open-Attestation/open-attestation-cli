import { extractLine, LineInfo, run } from "./utils/shell";
import { EndStatus, network, owner, receiver } from "./utils/constants";
import { TitleEscrowEndorseTransferOfOwnersCommand } from "../commands/title-escrow/title-escrow-command.type";
import { generateTransferOwnersCommand } from "./utils/commands";
import { changeHolderToken, checkEndorseOwner, checkFailure, deployTokenRegistry, mintNominatedToken, mintTokenRegistry } from "./utils/bootstrap";

describe("endorse change owner title-escrow", () => {
  jest.setTimeout(90000);

  let tokenRegistryAddress = "";
  beforeAll(() => {
    tokenRegistryAddress = deployTokenRegistry(owner.privateKey);
  });

  const defaultTransferOwners = {
    newOwner: receiver.ethAddress,
    newHolder: receiver.ethAddress,
    network: network,
    dryRun: false,
  };

  it("should be able to endorse change owner title-escrow on token-registry", async () => {
    const { tokenRegistry, tokenId } = mintNominatedToken(
      owner.privateKey,
      defaultTransferOwners.newOwner,
      tokenRegistryAddress
    );
    const transferOwners: TitleEscrowEndorseTransferOfOwnersCommand = {
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      ...defaultTransferOwners,
    };
    const command = generateTransferOwnersCommand(transferOwners, owner.privateKey);
    const results = run(command);
    const { beneficiary, holder, tokenId: tokenIdResult } = checkEndorseOwner(results);
    expect(beneficiary).toBe(transferOwners.newOwner);
    expect(holder).toBe(transferOwners.newHolder);
    expect(tokenIdResult).toBe(transferOwners.tokenId);
  });

  it("should not be able to endorse change owner on un-nominated title-escrow", async () => {
    const { tokenRegistry, tokenId } = mintTokenRegistry(
      owner.privateKey,
      tokenRegistryAddress
    );
    const transferOwners: TitleEscrowEndorseTransferOfOwnersCommand = {
      tokenId: tokenId,
      tokenRegistry: tokenRegistry,
      ...defaultTransferOwners,
    };
    const command = generateTransferOwnersCommand(transferOwners, owner.privateKey);
    const results = run(command);
    checkFailure(results, "")
  });
});
