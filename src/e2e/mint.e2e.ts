import { generateTokenId, isTokenId } from "./utils/token-management";
import { extractStatus, run } from "./utils/shell";
import {
  AddressLength,
  BurnAddress,
  defaultRunParameters,
  EndStatus,
  network,
  owner,
  receiver,
  TokenIdLength,
  TokenInfo,
} from "./utils/constants";
import { isAddress } from "web3-utils";
import { TokenRegistryIssueCommand } from "../commands/token-registry/token-registry-command.type";
import { generateMintTitleEscrowCommand } from "./utils/commands";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { BigNumber } from "ethers";
import { deployTokenRegistry, validateMintData, MintData, checkFailure, checkMintSuccess } from "./utils/bootstrap";

export const mint = async () => {
// describe("deploy token-registry", () => {
  // jest.setTimeout(90000);

  
  const tokenRegistryAddress = deployTokenRegistry(owner.privateKey);

  // it("should be able to mint title-escrow on token-registry", async () => {
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: tokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: owner.ethAddress,
      holder: owner.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    const mintResults = checkMintSuccess(results);
    validateMintData(titleEscrowParameter as MintData, mintResults);

    const signer = await getSigner(titleEscrowParameter.network, owner.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      titleEscrowParameter.address,
      titleEscrowParameter.tokenId
    );
    if(!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if(!(titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary)) throw new Error(`titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary`);
    if(!(titleEscrowInfo.holder === titleEscrowParameter.holder)) throw new Error(`titleEscrowInfo.holder === titleEscrowParameter.holder`);
    if(!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if(!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if(!(titleEscrowInfo.registry === titleEscrowParameter.address)) throw new Error(`titleEscrowInfo.registry === titleEscrowParameter.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(titleEscrowParameter.tokenId));
    if(!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  // it("should be able to mint title-escrow for a different wallet on token-registry", async () => {
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: tokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: receiver.ethAddress,
      holder: receiver.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    const mintResults = checkMintSuccess(results);
    validateMintData(titleEscrowParameter as MintData, mintResults);

    const signer = await getSigner(titleEscrowParameter.network, receiver.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      titleEscrowParameter.address,
      titleEscrowParameter.tokenId
    );
    if(!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if(!(titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary)) throw new Error(`titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary`);
    if(!(titleEscrowInfo.holder === titleEscrowParameter.holder)) throw new Error(`titleEscrowInfo.holder === titleEscrowParameter.holder`);
    if(!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if(!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if(!(titleEscrowInfo.registry === titleEscrowParameter.address)) throw new Error(`titleEscrowInfo.registry === titleEscrowParameter.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(titleEscrowParameter.tokenId));
    if(!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  // it("should fail with invalid token id", async () => {
  {
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: tokenRegistryAddress,
      tokenId: "0xZ",
      beneficiary: receiver.ethAddress,
      holder: receiver.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    checkFailure(results, "invalid BigNumber string");
  }

  // it("should fail with invalid token registry", async () => {
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: BurnAddress,
      tokenId: tokenId,
      beneficiary: receiver.ethAddress,
      holder: receiver.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  }

  // it("should fail with invalid beneficiary", async () => {
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: tokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: BurnAddress,
      holder: receiver.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  // it("should fail with invalid holder", async () => {
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: tokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: receiver.ethAddress,
      holder: BurnAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    checkFailure(results, "missing revert data in call exception");
  }

  // it("should fail with no funds", async () => {
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      ...defaultRunParameters,
      address: tokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: receiver.ethAddress,
      holder: receiver.ethAddress,
      network: "mainnet",
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    checkFailure(results, "null");
  }
}
