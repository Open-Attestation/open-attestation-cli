import { deployTokenRegistry, generateTokenId } from "../fixture/e2e/utils";
import { run } from "../fixture/e2e/shell";
import { emoji, network, owner } from "../fixture/e2e/constants";
import { isAddress } from "web3-utils";

describe("deploy token-registry", () => {
  jest.setTimeout(90000);

  let tokenRegistryAddress = "";
  beforeAll(() => {
    tokenRegistryAddress = deployTokenRegistry(owner.privateKey);
  });

  it("should be able to mint title-escrow on token-registry", async () => {
    const tokenId = generateTokenId();
    const command = `npm run dev -- token-registry mint --address ${tokenRegistryAddress} --tokenId ${tokenId} --beneficiary ${owner.ethAddress} --holder ${owner.ethAddress} -k ${owner.privateKey} --network ${network}`;
    const results = run(command);
    const tokenRegistrySuccessFormat = `${emoji.tick}  success   Token with hash `;
    const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    expect(checkSuccess).toBe(true);
    const splitResults = results.trim().split("\n");
    const titleEscrowAddressLine = splitResults[splitResults.length - 2];
    const titleEscrowAddress = titleEscrowAddressLine.trim().substring(115, 115 + 42);
    expect(isAddress(titleEscrowAddress)).toBe(true);
  });
});
