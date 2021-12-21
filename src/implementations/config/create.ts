import fs from "fs";
import path from "path";
import { info } from "signale";
import { readFile } from "../../implementations/utils/disk";
import { handler as createTemporaryDns } from "../../commands/dns/txt-record/create";
import { CreateConfigCommand } from "../../commands/config/config.type";
import { DnsName } from "./types";
import { Wallet } from "ethers";
import { getUpdateForms, getConfigFile, validate, getTokenRegistryAddress, getDocumentStoreAddress } from "./helpers";

const SANDBOX_ENDPOINT_URL = "https://sandbox.fyntech.io";

export const create = async ({
  encryptedWalletPath,
  outputDir,
  configTemplatePath,
  configTemplateUrl,
}: CreateConfigCommand): Promise<string> => {
  const wallet = await readFile(encryptedWalletPath);
  const walletObject = JSON.parse(wallet) as Wallet;
  info(`Wallet detected at ${encryptedWalletPath}`);

  const configFile = await getConfigFile(configTemplatePath, configTemplateUrl);
  const { forms } = configFile;

  if (!validate(forms)) {
    throw new Error("Invalid form detected in config file, please update the form before proceeding.");
  }

  const hasTransferableRecord = forms.some((form) => form.type === "TRANSFERABLE_RECORD");
  const hasDocumentStore = forms.some((form) => form.type === "VERIFIABLE_DOCUMENT");
  const hasDid = forms.some(
    (form) => form.defaults.issuers.some((issuer) => issuer.identityProof?.type.includes("DID")) // TODO: v3 does not have `issuers` but `issuer` instead
  );

  let tokenRegistryAddress = "";
  let documentStoreAddress = "";
  let dnsNameTransferableRecord: DnsName = "";
  let dnsNameVerifiable: DnsName = "";
  let dnsNameDid: DnsName = "";

  if (hasTransferableRecord) {
    tokenRegistryAddress = await getTokenRegistryAddress(encryptedWalletPath);
    dnsNameTransferableRecord = await createTemporaryDns({
      networkId: 3,
      address: tokenRegistryAddress,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  if (hasDocumentStore) {
    documentStoreAddress = await getDocumentStoreAddress(encryptedWalletPath);
    dnsNameVerifiable = await createTemporaryDns({
      networkId: 3,
      address: documentStoreAddress,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  if (hasDid) {
    // DID no need deploy any
    dnsNameDid = await createTemporaryDns({
      networkId: 3,
      publicKey: `did:ethr:0x${walletObject.address}#controller`,
      sandboxEndpoint: SANDBOX_ENDPOINT_URL,
    });
  }

  const updatedForms = getUpdateForms({
    forms,
    walletObject,
    documentStoreAddress,
    tokenRegistryAddress,
    dnsNameVerifiable,
    dnsNameDid,
    dnsNameTransferableRecord,
  });

  const updatedConfigFile = {
    ...configFile,
    wallet: { ...configFile.wallet, encryptedJson: wallet },
    forms: updatedForms,
  };
  const outputPath = path.join(outputDir, "config.json");
  fs.writeFileSync(outputPath, JSON.stringify(updatedConfigFile, null, 2));

  return outputPath;
};
