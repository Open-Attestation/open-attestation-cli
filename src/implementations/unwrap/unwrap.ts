import {
  documentsInDirectory,
  readOpenAttestationFile,
  writeDocumentToDisk,
  printDocumentToConsole,
} from "../utils/disk";
import mkdirp from "mkdirp";
import { getData, OpenAttestationDocument } from "@govtechsg/open-attestation";
import path from "path";

export enum Output {
  File,
  Directory,
  StdOut,
}

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
        unwrappedDocumentPath: unwrappedDocumentDir,
        file,
        document: unwrappedDocument,
      });
    } catch (e) {
      throw e;
    }
  }
  return oaArray.length;
};

const writeOutput = ({
  outputPathType,
  unwrappedDocumentPath,
  file,
  document,
}: {
  outputPathType: Output;
  unwrappedDocumentPath?: string;
  file: string;
  document: any;
}): void => {
  if (outputPathType === Output.File && unwrappedDocumentPath) {
    writeDocumentToDisk(path.parse(unwrappedDocumentPath).dir, path.parse(unwrappedDocumentPath).base, document);
  } else if (outputPathType === Output.Directory && unwrappedDocumentPath) {
    writeDocumentToDisk(unwrappedDocumentPath, path.parse(file).base, document);
  } else {
    printDocumentToConsole(document); // print to console, no file created
  }
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
