import { utils, v2, v3 } from "@tradetrust-tt/tradetrust";
import fs from "fs";
import path from "path";
import { info } from "signale";
import { CreateConfigCommand } from "../../commands/config/config.type";
import { handler as createTemporaryDns } from "../../commands/dns/txt-record/create";
import { readFile } from "../utils/disk";
import {
  getConfigFile,
  getConfigWithUpdatedForms,
  getConfigWithUpdatedNetwork,
  getConfigWithUpdatedWallet,
  getDocumentStoreAddress,
  getTokenRegistryAddress,
  validate,
} from "./helpers";
import { Dns } from "./types";
import { getWalletOrSigner } from "../utils/wallet";
import { supportedNetwork } from "../../common/networks";

const SANDBOX_ENDPOINT_URL = "https://sandbox.fyntech.io";

export const create = async ({
  encryptedWalletPath,
  outputDir,
  configTemplatePath,
  configTemplateUrl,
  network,
}: CreateConfigCommand): Promise<string> => {
  const walletStr = await readFile(encryptedWalletPath);
  const { address } = JSON.parse(walletStr);
  info(`Wallet detected at ${encryptedWalletPath}`);

  const wallet = await getWalletOrSigner({ network, encryptedWalletPath });

  const configFile = await getConfigFile(configTemplatePath, configTemplateUrl);
  const { forms } = configFile;

  const networkId = supportedNetwork[network].networkId;
  const networkCurrency = supportedNetwork[network].currency;

  const chain = {
    id: String(networkId), // schema `chainId` is defined as string -> https://schema.openattestation.com/2.0/schema.json
    currency: networkCurrency,
  };

  if (!validate(forms)) {
    throw new Error("Invalid form detected in config file, please update the form before proceeding.");
  }

  const hasTransferableRecord = forms.some((form) => form.type === "TRANSFERABLE_RECORD");
  const hasDocumentStore = forms.some((form) => form.type === "VERIFIABLE_DOCUMENT");
  const hasDid = forms.some((form) => {
    //check form for v2/v3
    const didCheckList = ["DID", "DNS-DID"];
    if (utils.isRawV3Document(form.defaults)) {
      const v3Defaults = form.defaults as v3.OpenAttestationDocument;
      return didCheckList.includes(v3Defaults.openAttestationMetadata.proof.method);
    } else {
      const v2Defaults = form.defaults as v2.OpenAttestationDocument;
      return v2Defaults.issuers.some((issuer) => {
        const identityProof = issuer.identityProof;
        if (!identityProof) return false;
        return didCheckList.includes(identityProof.type);
      });
    }
  });

  let tokenRegistryAddress = "";
  let documentStoreAddress = "";
  let dnsTransferableRecord: Dns = "";
  let dnsVerifiable: Dns = "";
  let dnsDid: Dns = "";

  if (hasTransferableRecord) {
    tokenRegistryAddress = await getTokenRegistryAddress(encryptedWalletPath, wallet, network);
    dnsTransferableRecord = await createTemporaryDns({
      networkId: networkId,
      address: tokenRegistryAddress,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  if (hasDocumentStore) {
    documentStoreAddress = await getDocumentStoreAddress(encryptedWalletPath, wallet, network);
    dnsVerifiable = await createTemporaryDns({
      networkId: networkId,
      address: documentStoreAddress,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  if (hasDid) {
    // DID no need deploy any
    dnsDid = await createTemporaryDns({
      networkId: networkId,
      publicKey: `did:ethr:0x${address}#controller`,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  const updatedConfigFileWithNetwork = getConfigWithUpdatedNetwork({ configFile, network });

  const updatedConfigFileWithWallet = getConfigWithUpdatedWallet({
    configFile: updatedConfigFileWithNetwork,
    walletStr,
  });

  const updatedConfigFileWithForms = getConfigWithUpdatedForms({
    configFile: updatedConfigFileWithWallet,
    chain,
    documentStoreAddress,
    tokenRegistryAddress,
    dnsVerifiable,
    dnsDid,
    dnsTransferableRecord,
  });

  const outputPath = path.join(outputDir, "config.json");
  fs.writeFileSync(outputPath, JSON.stringify(updatedConfigFileWithForms, null, 2));

  return outputPath;
};
