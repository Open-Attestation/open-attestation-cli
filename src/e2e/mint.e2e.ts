import { generateTokenId } from "./utils/token-management";
import { run } from "./utils/shell";
import { BurnAddress, defaultRunParameters, owner, receiver } from "./utils/constants";
import { TokenRegistryIssueCommand } from "../commands/token-registry/token-registry-command.type";
import { generateMintTitleEscrowCommand } from "./utils/commands";
import { getSigner, retrieveTitleEscrow } from "./utils/contract-checks";
import { BigNumber } from "ethers";
import {
  deployE2ETokenRegistry,
  validateE2EMintData,
  E2EMintData,
  checkE2EFailure,
  checkE2EMintSuccess,
} from "./utils/helpers";

export const mintE2EToken = async (): Promise<void> => {
  const tokenRegistryAddress = deployE2ETokenRegistry(owner.privateKey);

  //"should be able to mint title-escrow on token-registry"
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
    const mintResults = checkE2EMintSuccess(results);
    validateE2EMintData(titleEscrowParameter as E2EMintData, mintResults);

    const signer = await getSigner(titleEscrowParameter.network, owner.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      titleEscrowParameter.address,
      titleEscrowParameter.tokenId
    );
    if (!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if (!(titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary))
      throw new Error(`titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary`);
    if (!(titleEscrowInfo.holder === titleEscrowParameter.holder))
      throw new Error(`titleEscrowInfo.holder === titleEscrowParameter.holder`);
    if (!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if (!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if (!(titleEscrowInfo.registry === titleEscrowParameter.address))
      throw new Error(`titleEscrowInfo.registry === titleEscrowParameter.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(titleEscrowParameter.tokenId));
    if (!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  //"should be able to mint title-escrow for a different wallet on token-registry"
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
    const mintResults = checkE2EMintSuccess(results);
    validateE2EMintData(titleEscrowParameter as E2EMintData, mintResults);

    const signer = await getSigner(titleEscrowParameter.network, receiver.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      titleEscrowParameter.address,
      titleEscrowParameter.tokenId
    );
    if (!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if (!(titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary))
      throw new Error(`titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary`);
    if (!(titleEscrowInfo.holder === titleEscrowParameter.holder))
      throw new Error(`titleEscrowInfo.holder === titleEscrowParameter.holder`);
    if (!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if (!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if (!(titleEscrowInfo.registry === titleEscrowParameter.address))
      throw new Error(`titleEscrowInfo.registry === titleEscrowParameter.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(titleEscrowParameter.tokenId));
    if (!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  //"should be able to mint title-escrow for a different beneficiary on token-registry"
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: tokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: receiver.ethAddress,
      holder: owner.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    const mintResults = checkE2EMintSuccess(results);
    validateE2EMintData(titleEscrowParameter as E2EMintData, mintResults);

    const signer = await getSigner(titleEscrowParameter.network, receiver.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      titleEscrowParameter.address,
      titleEscrowParameter.tokenId
    );
    if (!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if (!(titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary))
      throw new Error(`titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary`);
    if (!(titleEscrowInfo.holder === titleEscrowParameter.holder))
      throw new Error(`titleEscrowInfo.holder === titleEscrowParameter.holder`);
    if (!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if (!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if (!(titleEscrowInfo.registry === titleEscrowParameter.address))
      throw new Error(`titleEscrowInfo.registry === titleEscrowParameter.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(titleEscrowParameter.tokenId));
    if (!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  //"should be able to mint title-escrow for a different holder on token-registry"
  {
    const tokenId = generateTokenId();
    const titleEscrowParameter: TokenRegistryIssueCommand = {
      address: tokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: owner.ethAddress,
      holder: receiver.ethAddress,
      ...defaultRunParameters,
    };
    const command = generateMintTitleEscrowCommand(titleEscrowParameter, owner.privateKey);
    const results = run(command);
    const mintResults = checkE2EMintSuccess(results);
    validateE2EMintData(titleEscrowParameter as E2EMintData, mintResults);

    const signer = await getSigner(titleEscrowParameter.network, receiver.privateKey);
    const titleEscrowInfo = await retrieveTitleEscrow(
      signer,
      titleEscrowParameter.address,
      titleEscrowParameter.tokenId
    );
    if (!(titleEscrowInfo.active === true)) throw new Error(`titleEscrowInfo.active === true`);
    if (!(titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary))
      throw new Error(`titleEscrowInfo.beneficiary === titleEscrowParameter.beneficiary`);
    if (!(titleEscrowInfo.holder === titleEscrowParameter.holder))
      throw new Error(`titleEscrowInfo.holder === titleEscrowParameter.holder`);
    if (!(titleEscrowInfo.isHoldingToken === true)) throw new Error(`titleEscrowInfo.isHoldingToken === true`);
    if (!(titleEscrowInfo.nominee === BurnAddress)) throw new Error(`titleEscrowInfo.nominee === BurnAddress`);
    if (!(titleEscrowInfo.registry === titleEscrowParameter.address))
      throw new Error(`titleEscrowInfo.registry === titleEscrowParameter.address`);
    const correctTokenID = titleEscrowInfo.tokenId.eq(BigNumber.from(titleEscrowParameter.tokenId));
    if (!(correctTokenID === true)) throw new Error(`correctTokenID === true`);
  }

  //"should fail with invalid token id"
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
    checkE2EFailure(results, "invalid BigNumber string");
  }

  //"should fail with invalid token registry"
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
    checkE2EFailure(results, `Address ${BurnAddress} is not a valid Contract`);
  }

  //"should fail with invalid beneficiary"
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
    checkE2EFailure(results, "missing revert data in call exception");
  }

  //"should fail with invalid holder"
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
    checkE2EFailure(results, "missing revert data in call exception");
  }
};
