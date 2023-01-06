import { isTokenId } from "./utils/token-management";
import { extractLine, extractStatus, LineInfo, run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, EndStatus, network, owner, receiver, TokenIdLength, TokenInfo } from "./utils/constants";
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


describe("surrender title-escrow", () => {
  jest.setTimeout(90000);

  let tokenRegistryAddress = "";
  beforeAll(() => {
    tokenRegistryAddress = deployTokenRegistry(owner.privateKey);
  });

  it("should be able to surrender title-escrow on token-registry", async () => {
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
    expect(isAddress(titleEscrowOwner)).toBe(true);
    expect(titleEscrowOwner).not.toBe(surrenderTitleEscrow.tokenRegistry);
    const command = generateSurrenderCommand(surrenderTitleEscrow, owner.privateKey);
    const results = run(command);
    const surrenderResults = checkSurrenderSuccess(results);
    expect(surrenderResults.tokenId).toBe(surrenderTitleEscrow.tokenId);
    titleEscrowOwner = await retrieveTitleEscrowOwner(
      signer,
      surrenderTitleEscrow.tokenRegistry,
      surrenderTitleEscrow.tokenId
    );
    expect(titleEscrowOwner).toBe(surrenderTitleEscrow.tokenRegistry);
  });

  it("should not surrender unowned title escrow", async () => {
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
    expect(isAddress(titleEscrowOwner)).toBe(true);
    expect(titleEscrowOwner).not.toBe(surrenderTitleEscrow.tokenRegistry);
  });

  it("should not surrender invalid title escrow", async () => {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry,
      tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  });

  it("should not surrender invalid title escrow with invalid token registry", async () => {
    const { tokenRegistry, tokenId } = mintTokenRegistry(owner.privateKey, tokenRegistryAddress);

    const surrenderTitleEscrow: BaseTitleEscrowCommand = {
      ...defaultTitleEscrow,
      tokenRegistry: BurnAddress,
      tokenId,
    };
    const command = generateSurrenderCommand(surrenderTitleEscrow, receiver.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  });
});
