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

  const fileNames = await documentsInDirectory(rawDocumentsPath);
  const returnDocuments = Promise.all(
    fileNames.map(async file => {
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

  return returnDocuments;
};
