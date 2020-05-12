import { dirSync } from "tmp";
import mkdirp from "mkdirp";
import path from "path";
import { documentsInDirectory, readDocumentFile, writeDocumentToDisk } from "../utils/disk";
import { sign as oaSign, ProofType, SignedWrappedDocument } from "@govtechsg/open-attestation";

export enum Output {
  File,
  Directory,
  StdOut
}

interface SignArguments {
  rawDocumentsPath: string;
  outputPath?: string;
  outputPathType: Output;
  privateKey: string;
  publicKey: string;
}

export const sign = async ({
  rawDocumentsPath,
  outputPath,
  outputPathType,
  privateKey,
  publicKey
}: SignArguments): Promise<SignedWrappedDocument<any>[]> => {
  if (outputPath) {
    // Create output dir
    mkdirp.sync(outputPathType === Output.File ? path.parse(outputPath).dir : outputPath);
  }

  // Create intermediate dir
  const { name: intermediateDir, removeCallback } = dirSync({
    unsafeCleanup: true
  });

  // Copy to intermediate dir
  const documentFileNames = await documentsInDirectory(rawDocumentsPath);
  documentFileNames.forEach(file => {
    const document = readDocumentFile(file);
    const filename = path.parse(file).base;
    // Write digested document to new directory
    writeDocumentToDisk(intermediateDir, filename, document);
  });

  const tempFolderFileNames = await documentsInDirectory(intermediateDir);
  const returnDocuments = Promise.all(
    tempFolderFileNames.map(async file => {
      const document = readDocumentFile(file);
      const signedDocument = await oaSign(document, {
        privateKey: privateKey,
        verificationMethod: publicKey,
        type: ProofType.EcdsaSecp256k1Signature2019
      });

      // Write to destination folder
      if (outputPath && outputPathType === Output.File) {
        writeDocumentToDisk(path.parse(outputPath).dir, path.parse(outputPath).base, signedDocument);
      } else if (outputPath && outputPathType === Output.Directory) {
        writeDocumentToDisk(outputPath, path.parse(file).base, signedDocument);
      } else {
        console.log(signedDocument); // print to console, no file created
      }
      return signedDocument;
    })
  );

  removeCallback();
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return returnDocuments;
};
