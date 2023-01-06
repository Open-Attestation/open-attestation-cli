
import { isAddress } from "web3-utils";
import { mintTokenRegistry } from ".";
import { TitleEscrowTransferHolderCommand } from "../../../commands/title-escrow/title-escrow-command.type";
import { generateChangeHolderCommand } from "../commands";
import { AddressLength, BurnAddress, defaultRunParameters, EndStatus, network, receiver, TokenIdLength } from "../constants";
import { extractStatus, run } from "../shell";
import { isTokenId } from "../token-management";

// ✔  success   Transferable record with hash 0x9837ba0954300cf74dea2d7ee9f294a3d1ca0ce2fb8025a3de505440971a7baf's holder has been successfully changed to holder with address: 0xcDFAcbb428DD30ddf6d99875dcad04CbEFcd6E60


export const defaultTransferHolder = {
    newHolder: receiver.ethAddress,
    network: network,
    dryRun: false,
  };
  
export const checkChangeHolderSuccess = (results: string) => {
    const statusLine = extractStatus(results, EndStatus.success, "Transferable record with hash ");
    if (statusLine.length <= 0) throw new Error("Change Holder failed");
    const titleEscrowAddressLine = statusLine[0].lineContent;
    const tokenId = titleEscrowAddressLine.substring(43, 43 + TokenIdLength);
    const holder = titleEscrowAddressLine.substring(173, 173 + AddressLength);
  
    const holderIsAddress = isAddress(holder);
    const isValidTokenId = isTokenId(tokenId);
  
    if (!holderIsAddress) throw new Error("Invalid holder address");
    if (!isValidTokenId) throw new Error("Invalid token id");
  
    return {
      newHolder: holder,
      tokenId,
    };
  };

  export const changeHolderToken = (privateKey: string, transferHolder: TitleEscrowTransferHolderCommand) => {
    const command = generateChangeHolderCommand(transferHolder, privateKey);
    const results = run(command);
    checkChangeHolderSuccess(results);
  }


  