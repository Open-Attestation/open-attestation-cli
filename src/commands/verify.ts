import { Argv } from "yargs";
import signale from "signale";
import { VerifyCommand } from "./command-types";
import {
  isValid,
  openAttestationVerifiers,
  openAttestationDidIdentityProof,
  verificationBuilder,
} from "@govtechsg/oa-verify";
import { readOpenAttestationFile } from "../implementations/utils/disk";
import { withNetworkOption } from "./shared";
import { getSupportedNetwork } from "./networks";

export const command = "verify [options]";

export const describe = "Verify an OpenAttestation file";

export const builder = (yargs: Argv): Argv =>
  withNetworkOption(
    yargs
      .option("document", {
        demandOption: true,
        alias: "d",
        description: "OpenAttestation document to verify.",
        normalize: true,
        type: "string",
      })
      .option("verbose", {
        alias: "v",
        type: "boolean",
        default: false,
        description: "Display more details",
      })
  );
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
    const verify = verificationBuilder([...openAttestationVerifiers, openAttestationDidIdentityProof], {
      provider: getSupportedNetwork(network).provider(),
    });
    const fragments = await verify(readOpenAttestationFile(document));
    show(isValid(fragments), "The document is valid", "The document is not valid");
    if (verbose) {
      signale.note("Showing additional information on the status of the verification");
      show(
        isValid(fragments, ["DOCUMENT_INTEGRITY"]),
        "The document has not been tampered",
        "The document has been tampered"
      );
      show(isValid(fragments, ["DOCUMENT_STATUS"]), "The document has been issued", "The document has not been issued");
      show(
        isValid(fragments, ["ISSUER_IDENTITY"]),
        "The issuer identity has been verified",
        "The issuer identity has not been verified"
      );
    } else if (!isValid(fragments)) {
      // if the document is not valid and the verbose flag has not been set, let's suggest the user to display more information
      signale.note("You might want to use `--verbose` flag to get additional information about the document status");
    }
  } catch (error) {
    signale.error(error);
  }
};
