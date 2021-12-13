import { Issuer } from "@govtechsg/open-attestation/dist/types/__generated__/schema.2.0";
import fs from "fs";
import path from "path";
import { info } from "signale";
import { readFile } from "../../implementations/utils/disk";
import { handler as createTemporaryDns } from "../../commands/dns/txt-record/create";
import { CreateConfigCommand } from "../../commands/config/config.type";
import { ConfigFile, TypesOfForms } from "./types";
import { Wallet } from "ethers";
import { getDocumentStoreOrTokenRegistryAddress, updateConfigFile, updateForms, getConfigFile } from "./helpers";

const sandboxEndpointUrl = "https://sandbox.fyntech.io";

export const create = async ({
  encryptedWalletPath,
  outputDir,
  configType,
  configTemplatePath,
}: CreateConfigCommand): Promise<string | undefined> => {
  const wallet = await readFile(encryptedWalletPath);
  const walletObject = JSON.parse(wallet) as Wallet;

  info(`Wallet detected at ${encryptedWalletPath}`);

  const configFile: ConfigFile = await getConfigFile(configType, configTemplatePath);

  const { forms } = configFile;

  const getContractAddress = async (
    typesOfForms: TypesOfForms[],
    formType: "VERIFIABLE_DOCUMENT" | "TRANSFERABLE_RECORD",
    identityProofType: "DNS-DID" | "DNS-TXT"
  ): Promise<string> => {
    const isValidForm = typesOfForms.some(
      (item: TypesOfForms) =>
        item.type === formType && (<any>Object).values(item.identityProofTypes).includes(identityProofType)
    );

    if (!isValidForm)
      throw new Error("Invalid form detected in config file, please update the form before proceeding.");

    switch (true) {
      case formType === "TRANSFERABLE_RECORD":
      case formType === "VERIFIABLE_DOCUMENT" && identityProofType === "DNS-TXT":
        return await getDocumentStoreOrTokenRegistryAddress(encryptedWalletPath, formType);

      case formType === "VERIFIABLE_DOCUMENT" && identityProofType === "DNS-DID":
        info(`Creating temporary DNS for DID`);
        return (
          (await createTemporaryDns({
            networkId: 3,
            publicKey: `did:ethr:0x${walletObject.address}#controller`,
            sandboxEndpoint: sandboxEndpointUrl,
          })) || ""
        );

      default:
        throw new Error("Invalid form detected in config file, please update the form before proceeding.");
    }
  };

  // loop through the form template to check the type of forms
  const typesOfForms: TypesOfForms[] = forms.map((form) => {
    const identityProofTypes = form.defaults.issuers.map((issuer: Issuer) => issuer.identityProof?.type);
    return {
      type: form.type,
      identityProofTypes: identityProofTypes,
    };
  });

  // generate doc store, token registry and DNS based on the form type in the form template
  const documentStoreAddress = await getContractAddress(typesOfForms, "VERIFIABLE_DOCUMENT", "DNS-TXT");
  const verifiableDocumentDnsTxtName = documentStoreAddress
    ? await createTemporaryDns({ networkId: 3, address: documentStoreAddress, sandboxEndpoint: sandboxEndpointUrl })
    : "";
  const verifiableDocumentDnsDidName = await getContractAddress(typesOfForms, "VERIFIABLE_DOCUMENT", "DNS-DID");
  const tokenRegistryAddress = await getContractAddress(typesOfForms, "TRANSFERABLE_RECORD", "DNS-TXT");
  const tokenRegistryDnsName = tokenRegistryAddress
    ? await createTemporaryDns({ networkId: 3, address: tokenRegistryAddress, sandboxEndpoint: sandboxEndpointUrl })
    : "";

  const updatedForms = updateForms(
    forms,
    documentStoreAddress,
    tokenRegistryAddress,
    walletObject,
    verifiableDocumentDnsTxtName || "",
    verifiableDocumentDnsDidName,
    tokenRegistryDnsName || ""
  );

  const updatedConfigFile = updateConfigFile(configFile, wallet, updatedForms);

  const configFileName = "config.json";
  const outputPath = path.join(outputDir, configFileName);
  fs.writeFileSync(outputPath, JSON.stringify(updatedConfigFile, null, 2));
  return outputPath;
};
