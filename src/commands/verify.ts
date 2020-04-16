import { Argv } from "yargs";
import signale from "signale";
import { VerifyCommand } from "./command-types";
import { isValid, VerificationFragment, verify } from "@govtechsg/oa-verify";
import { readDocumentFile } from "../implementations/wrap/diskUtils";

export const command = "verify [options]";

export const describe = "Verify an OpenAttestation file";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("document", {
      alias: "d",
      description: "OpenAttestation document to verify.",
      normalize: true,
      type: "string"
    })
    .option("network", {
      alias: "n",
      choices: ["mainnet", "ropsten"],
      default: "mainnet",
      description: "Ethereum network to verify against"
    })
    .option("verbose", {
      alias: "v",
      type: "boolean",
      default: false,
      description: "Display more details"
    });

export const getRevokeFragment = (fragments: VerificationFragment[]): VerificationFragment[] =>
  fragments.filter(status => status.name === "OpenAttestationEthereumDocumentStoreRevoked");
export const getAllButRevokeFragment = (fragments: VerificationFragment[]): VerificationFragment[] =>
  fragments.filter(status => status.name !== "OpenAttestationEthereumDocumentStoreRevoked");

export const handler = async ({ document, network, verbose }: VerifyCommand): Promise<void> => {
  const show = (status: boolean, successMessage: string, errorMessage: string): void => {
    if (status) {
      signale.success(successMessage);
    } else {
      signale.error(errorMessage);
    }
  };
  try {
    signale.await(`Verifying ${document}`);
    const fragments = await verify(readDocumentFile(document), { network });
    show(isValid(fragments), "The document is valid", "The document is not valid");
    if (verbose) {
      signale.note("Showing additional information on the status of the verification");
      show(
        isValid(fragments, ["DOCUMENT_INTEGRITY"]),
        "The document has not been tampered",
        "The document has been tampered"
      );
      show(
        isValid(getAllButRevokeFragment(fragments), ["DOCUMENT_STATUS"]),
        "The document has been issued",
        "The document has not been issued"
      );
      show(
        isValid(getRevokeFragment(fragments), ["DOCUMENT_STATUS"]),
        "The document has not been revoked",
        "The document has been revoked"
      );
      show(
        isValid(fragments, ["ISSUER_IDENTITY"]),
        "The issuer identity has been verified",
        "The issuer identity has not been verified"
      );
    } else if (!isValid(fragments)) {
      // if the document is not valid and the verbose flag has not been set, let's suggest the user to display more information
      signale.note("You might want to use `--verbose` flag to get additional information about the document status");
    }
  } catch (err) {}
};

export default {
  command,
  describe,
  builder,
  handler
};
