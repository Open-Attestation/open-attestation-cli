import { PrivateKeyOption } from "../../commands/shared";
import { getPrivateKey } from "../utils/wallet";
import { documentsInDirectory, readOpenAttestationFile, writeDocumentToDisk } from "../utils/disk";
import { signDocument, SUPPORTED_SIGNING_ALGORITHM } from "@tradetrust-tt/tradetrust";
import path from "path";
import mkdirp from "mkdirp";

export type SignCommand = PrivateKeyOption & {
  rawDocumentsPath: string;
  outputDir: string;
  publicKey: string;
  algorithm: SUPPORTED_SIGNING_ALGORITHM;
};

export const sign = async ({
  rawDocumentsPath,
  outputDir,
  publicKey,
  algorithm,
  ...rest
}: SignCommand): Promise<void> => {
  const privateKey = await getPrivateKey(rest);
  if (!privateKey) throw new Error("Private key is not specified (use -k, -f or OA_PRIVATE_KEY to specify key)");

  // Create output dir
  if (outputDir) {
    mkdirp.sync(outputDir);
  }

  // Sign each document independently and save to output directory
  const documentFileNames = await documentsInDirectory(rawDocumentsPath);
  const deferredProcesses = documentFileNames.map(async (fileName) => {
    const file = await readOpenAttestationFile(fileName);
    const signingKey = {
      private: privateKey,
      public: publicKey,
    };
    const signedDocument = await signDocument(file, algorithm, signingKey);
    writeDocumentToDisk(outputDir, path.parse(fileName).base, signedDocument);
  });
  await Promise.all(deferredProcesses);
};
