import { deployTokenRegistry, mintSurrenderToken } from "../fixture/e2e/utils";
import { extractLine, LineInfo, run } from "../fixture/e2e/shell";
import { emoji, network, owner } from "../fixture/e2e/constants";
import { generateRejectSurrenderCommand } from "../fixture/e2e/commands";

describe("reject surrender title-escrow", () => {
  jest.setTimeout(90000);

  let tokenRegistryAddress = "";
  beforeAll(() => {
    tokenRegistryAddress = deployTokenRegistry(owner.privateKey);
  });

  const defaultTitleEscrow = {
    beneficiary: owner.ethAddress,
    holder: owner.ethAddress,
    network: network,
    dryRun: false,
  };

  it("should be able to reject surrender title-escrow on token-registry", async () => {
    const { tokenRegistry, tokenId } = mintSurrenderToken(owner.privateKey, tokenRegistryAddress);
    const command = generateRejectSurrenderCommand({ tokenRegistry, tokenId, ...defaultTitleEscrow }, owner.privateKey);
    const results = run(command);

    const tokenRegistrySuccessFormat = `${emoji.tick}  success   Surrendered transferable record with hash `;
    const queryResults = extractLine(results, tokenRegistrySuccessFormat);
    expect(queryResults).toBeTruthy();
    const filteredLine = (queryResults as LineInfo[])[0].lineContent.trim();
    const checkSuccess = filteredLine.includes(tokenRegistrySuccessFormat);
    expect(checkSuccess).toBe(true);
    const resultTokenId = filteredLine
      .trim()
      .substring(tokenRegistrySuccessFormat.length, tokenRegistrySuccessFormat.length + 66);
    expect(resultTokenId).toBe(tokenId);
  });

  it.todo("should be fail when user without permission attempts reject surrender");
});
