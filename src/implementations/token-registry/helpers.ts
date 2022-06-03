import { TradeTrustERC721, TradeTrustERC721Factory } from "@govtechsg/token-registry";
import { TradeTrustErc721Factory } from "@govtechsg/token-registry-v2";
import { TradeTrustERC721 as V2TradeTrustERC721 } from "@govtechsg/token-registry-v2/dist/ts/contracts";
import { TradeTrustERC721Interface } from "@govtechsg/token-registry/dist/types/contracts/TradeTrustERC721";
import { Wallet, Contract, utils } from "ethers";
import { FunctionFragment } from "ethers/lib/utils";
import { ConnectedSigner } from "../utils/wallet";

interface ConnectToTokenRegistryArgs {
  address: string;
  wallet: Wallet | ConnectedSigner;
}

interface ConnectToTokenReturnType {
  contract: TradeTrustERC721 | V2TradeTrustERC721;
  isV3: boolean;
}

//   interfaceId Title                 interfaceId     V2     V3
// --------------------------------- -------------- ------- -------
//  _INTERFACE_ID_ERC165              0x01ffc9a7     true    true
//  _INTERFACE_ID_ERC721              0x80ac58cd     true    true
//  _INTERFACE_ID_ERC721_ENUMERABLE   0x780e9d63     true    false
//  _INTERFACE_ID_ERC721_METADATA     0x5b5e139f     true    true
//  _INTERFACE_ID_TRADETRUST_ERC721   0x9f9e69f3     true    false
//  _INTERFACE_ID_TITLEESCROW         0xdcce2211     false   false

export const connectToTokenRegistry = async ({
  address,
  wallet,
}: ConnectToTokenRegistryArgs): Promise<ConnectToTokenReturnType> => {
  const tradeTrustERC721Interfaces: TradeTrustERC721Interface = TradeTrustERC721Factory.createInterface();
  const supportInterfacesFunctionFragment: FunctionFragment =
    tradeTrustERC721Interfaces.functions["supportsInterface(bytes4)"];
  const supportInterfacesInterface: string = supportInterfacesFunctionFragment.format(utils.FormatTypes.full);
  const testContract: Contract = new Contract(address, JSON.stringify([supportInterfacesInterface]), wallet);
  const connectedTestContract: Contract = testContract.connect(wallet);

  const isV2 = await connectedTestContract.callStatic["supportsInterface(bytes4)"]("0x9f9e69f3");
  const isV3 = !isV2;
  if (isV3) {
    const tokenRegistry = await TradeTrustERC721Factory.connect(address, wallet);
    return { isV3: isV3, contract: tokenRegistry };
  } else {
    const tokenRegistry = await TradeTrustErc721Factory.connect(address, wallet);
    return { isV3: isV3, contract: tokenRegistry };
  }
};