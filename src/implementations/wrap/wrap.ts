import { documentsInDirectory, readDocumentFile, writeDocumentToDisk } from "./diskUtils";
import { dirSync } from "tmp";
import mkdirp from "mkdirp";
import { isSchemaValidationError, wrapDocument, utils, getData } from "@govtechsg/open-attestation";
import path from "path";
import fetch from "node-fetch";
import Ajv from "ajv";

class SchemaValidationError extends Error {
  constructor(message: string, public validationErrors: Ajv.ErrorObject[], public document: any) {
    super(message);
  }
}

interface Schema {
  $id: string;
}

export enum Output {
  File,
  Directory,
  StdOut
}

export const digestDocument = async (
  undigestedDocumentPath: string,
  digestedDocumentDir: string,
  version: "open-attestation/2.0" | "open-attestation/3.0",
  unwrap: boolean,
  schema?: Schema,
  dnsTxt?: string,
  documentStore?: string
): Promise<Buffer[]> => {
  const hashArray: Buffer[] = [];
  const documentFileNames = await documentsInDirectory(undigestedDocumentPath);
  let compile: Ajv.ValidateFunction;
  if (schema) {
    compile = new Ajv().compile(schema);
  }

  documentFileNames.forEach(file => {
    const document = unwrap ? getData(readDocumentFile(file)) : readDocumentFile(file);

    // Append DNS proof if given
    if (dnsTxt) {
      Object.assign(document.proof, { identity: { location: dnsTxt, type: "DNS-TXT" } });
    }

    // Append document store if given
    if (documentStore) {
      Object.assign(document.proof, {
        method: "DOCUMENT_STORE",
        value: documentStore
      });
    }

    // Digest individual document
    if (compile) {
      const valid = compile(document);
      if (!valid) {
        throw new SchemaValidationError(
          `Document ${path.resolve(file)} is not valid against the provided schema`,
          compile.errors ?? [],
          document
        );
      }
    }
    try {
      const digest = wrapDocument(document, { externalSchemaId: schema?.$id, version });
      hashArray.push(utils.hashToBuffer(digest.signature.merkleRoot));
      const filename = path.parse(file).base;
      // Write digested document to new directory
      writeDocumentToDisk(digestedDocumentDir, filename, digest);
    } catch (e) {
      if (isSchemaValidationError(e)) {
        throw new SchemaValidationError(
          `Document ${path.resolve(file)} is not valid against open-attestation schema`,
          e.validationErrors ?? [],
          document
        );
      }
      throw e;
    }
  });
  return hashArray;
};

export const appendProofToDocuments = async (
  intermediateDir: string,
  hashMap: Record<string, { sibling: string; parent: string }>,
  outputPathType: Output,
  digestedDocumentPath?: string
): Promise<string> => {
  const documentFileNames = await documentsInDirectory(intermediateDir);
  let merkleRoot = "";

  documentFileNames.forEach(file => {
    const document = readDocumentFile(file);
    const documentHash = document.signature.targetHash;
    const proof = [];
    let candidateRoot = documentHash;
    let nextStep = hashMap[documentHash];
    while (nextStep) {
      // nextStep will be empty when there is no parent
      proof.push(nextStep.sibling);
      candidateRoot = nextStep.parent;
      nextStep = hashMap[candidateRoot];
    }
    document.signature.proof = proof;
    document.signature.merkleRoot = candidateRoot;
    if (!merkleRoot) merkleRoot = candidateRoot;

    if (outputPathType === Output.File && digestedDocumentPath) {
      writeDocumentToDisk(path.parse(digestedDocumentPath).dir, path.parse(digestedDocumentPath).base, document);
    } else if (outputPathType === Output.Directory && digestedDocumentPath) {
      writeDocumentToDisk(digestedDocumentPath, path.parse(file).base, document);
    } else {
      console.log(document); // print to console, no file created
    }
  });

  return merkleRoot;
};

export const merkleHashmap = (leafHashes: Buffer[]): Record<string, { sibling: string; parent: string }> => {
  const hashMap: Record<string, { sibling: string; parent: string }> = {};
  const hashArray = [leafHashes];

  let merklingCompleted = false;
  while (!merklingCompleted) {
    const currentLayerIndex = hashArray.length - 1;
    const nextLayerIndex = hashArray.length;
    const currentLayer = hashArray[currentLayerIndex];
    hashArray.push([]);

    const layerLength = currentLayer.length;
    for (let i = 0; i < layerLength - 1; i += 2) {
      const element1 = currentLayer[i];
      const element2 = currentLayer[i + 1];

      const nextHash = utils.combineHashBuffers(element1, element2);

      hashMap[element1.toString("hex")] = {
        sibling: element2.toString("hex"),
        parent: nextHash.toString("hex")
      };
      hashMap[element2.toString("hex")] = {
        sibling: element1.toString("hex"),
        parent: nextHash.toString("hex")
      };

      hashArray[nextLayerIndex].push(nextHash);
    }
    // If odd number, push last element to next layer
    if (currentLayer.length % 2 === 1) {
      hashArray[nextLayerIndex].push(currentLayer[currentLayer.length - 1]);
    }

    if (hashArray[nextLayerIndex].length === 1) merklingCompleted = true;
  }

  return hashMap;
};

const loadSchema = (schemaPath?: string): Promise<Schema | undefined> => {
  const checkSchema = (schema: any): Schema => {
    if (!schema.$id) {
      throw new Error("Invalid schema, you must provide an $id property to your schema");
    }
    return schema;
  };
  if (schemaPath && (schemaPath.startsWith("http://") || schemaPath.startsWith("https://"))) {
    return fetch(schemaPath)
      .then(response => response.json())
      .then(checkSchema);
  } else if (schemaPath) {
    return import(path.resolve(schemaPath)).then(checkSchema);
  }
  return Promise.resolve(undefined);
};

interface WrapArguments {
  inputPath: string;
  outputPath?: string;
  schemaPath?: string;
  version: "open-attestation/2.0" | "open-attestation/3.0";
  unwrap: boolean;
  outputPathType: Output;
  dnsTxt?: string;
  documentStore?: string;
}

export const wrap = async ({
  inputPath,
  outputPath,
  schemaPath,
  version,
  unwrap,
  outputPathType,
  dnsTxt,
  documentStore
}: WrapArguments): Promise<string> => {
  // Create output dir
  if (outputPath) {
    mkdirp.sync(outputPathType === Output.File ? path.parse(outputPath).dir : outputPath);
  }

  // Create intermediate dir
  const { name: intermediateDir, removeCallback } = dirSync({
    unsafeCleanup: true
  });

  // Phase 1: For each document, read content, digest and write to file
  const schema = await loadSchema(schemaPath);
  const individualDocumentHashes = await digestDocument(
    inputPath,
    intermediateDir,
    version,
    unwrap,
    schema,
    dnsTxt,
    documentStore
  );

  if (!individualDocumentHashes || individualDocumentHashes.length === 0)
    throw new Error(`No documents found in ${inputPath}`);

  // Phase 2: Efficient merkling to build hashmap
  const hashMap = merkleHashmap(individualDocumentHashes);

  // Phase 3: Add proofs to signedDocuments
  const merkleRoot = await appendProofToDocuments(intermediateDir, hashMap, outputPathType, outputPath);

  // Remove intermediate dir
  removeCallback();

  return merkleRoot;
};
