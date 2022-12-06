import { deployTokenRegistry, generateTokenId, mintToken } from "../fixture/e2e/utils";
import { run } from "../fixture/e2e/shell";
import { emoji, network, owner } from "../fixture/e2e/constants";
import { isAddress } from "web3-utils";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { defaultSeverityColor } from "snyk/dist/lib/snyk-test/common";

describe("surrender title-escrow", () => {
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

  it.todo("surrender is not working ????");
  it("should be able to surrender title-escrow on token-registry", async () => {
    expect(true).toBe(false);
    // const tokenId = generateTokenId();
    // const surrenderTitleEscrow: TokenRegistryIssueCommand = {
    //     address: tokenRegistryAddress,
    //     tokenId: tokenId,
    //     ...defaultTitleEscrow,
    // }
    // const titleEscrowAddress = mintToken(owner.privateKey, surrenderTitleEscrow);
    // console.log(titleEscrowAddress);
    // const command = `npm run dev -- title-escrow surrender --token-registry ${surrenderTitleEscrow.address} --tokenId ${surrenderTitleEscrow.tokenId} -k ${owner.privateKey} --network ${surrenderTitleEscrow.network}`;

    // const results = run(command);
    // const tokenRegistrySuccessFormat = `${emoji.tick}  success   Token registry deployed at `;
    // const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    // expect(checkSuccess).toBe(true);
    // const splitResults = results.trim().split("\n");
    // const tokenRegistryAddressLine = splitResults[splitResults.length - 2];
    // const tokenRegistryAddress = tokenRegistryAddressLine.trim().substring(tokenRegistrySuccessFormat.length);
    // expect(isAddress(tokenRegistryAddress)).toBe(true);

    // const tokenId = generateTokenId();
    // const command = `npm run dev -- token-registry mint --address ${tokenRegistryAddress} --tokenId ${tokenId} --beneficiary ${owner.ethAddress} --holder ${owner.ethAddress} -k ${owner.privateKey} --network ${network}`;
    // const results = run(command);
    // const tokenRegistrySuccessFormat = `${emoji.tick}  success   Token with hash `;
    // const checkSuccess = results.includes(tokenRegistrySuccessFormat);
    // expect(checkSuccess).toBe(true);
    // const splitResults = results.trim().split("\n");
    // const titleEscrowAddressLine = splitResults[splitResults.length - 2];
    // const titleEscrowAddress = titleEscrowAddressLine.trim().substring(115, 115 + 42);
    // expect(isAddress(titleEscrowAddress)).toBe(true);
  });
});
