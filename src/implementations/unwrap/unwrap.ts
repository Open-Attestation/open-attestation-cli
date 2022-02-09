import { documentsInDirectory, readOpenAttestationFile, writeOutput, Output } from "../utils/disk";
import mkdirp from "mkdirp";
import { getData, OpenAttestationDocument } from "@govtechsg/open-attestation";
import path from "path";

export const unwrapIndividualDocuments = async (
  wrappedDocumentPath: string,
  unwrappedDocumentDir: string | undefined,
  outputPathType: Output
): Promise<number> => {
  const oaArray: OpenAttestationDocument[] = [];
  const documentFileNames = await documentsInDirectory(wrappedDocumentPath);

  for (const file of documentFileNames) {
    const unwrappedDocument = getData(readOpenAttestationFile(file));
    oaArray.push(unwrappedDocument);

    try {
      // Write unwrapped document to new directory
      writeOutput({
        outputPathType,
        documentPath: unwrappedDocumentDir,
        file,
        document: unwrappedDocument,
      });
    } catch (e) {
      throw e;
    }
  }
  return oaArray.length;
};

interface UnwrapArguments {
  inputPath: string;
  outputPath?: string;
  outputPathType: Output;
}

export const unwrap = async ({
  inputPath,
  outputPath,
  outputPathType,
}: UnwrapArguments): Promise<number | undefined> => {
  // Create output dir
  if (outputPath) {
    mkdirp.sync(outputPathType === Output.File ? path.parse(outputPath).dir : outputPath);
  }

  return await unwrapIndividualDocuments(inputPath, outputPath, outputPathType);
};
