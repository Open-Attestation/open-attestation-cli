import { documentsInDirectory, readDocumentFile, writeDocumentToDisk } from "./diskUtils";
import { dirSync } from "tmp";
import mkdirp from "mkdirp";
import { isSchemaValidationError, wrapDocument, utils, getData } from "@govtechsg/open-attestation";
import path from "path";
import fetch from "node-fetch";
import Ajv from "ajv";

interface WrapCommand {
  unwrappedDir: string;
  wrappedDir: string;
  schema: any;
  openAttestationV3: boolean;
  unwrap: boolean;
}

export const isWrapCommand = (args: any): args is WrapCommand => {
  return args._[0] === "batch" || args._[0] === "wrap";
};

class SchemaValidationError extends Error {
  constructor(message: string, public validationErrors: Ajv.ErrorObject[], public document: any) {
    super(message);
  }
}

interface Schema {
  $id: string;
}

export const digestDocument = async (
  undigestedDocumentDir: string,
  digestedDocumentDir: string,
  version: "open-attestation/2.0" | "open-attestation/3.0",
  unwrap: boolean,
  schema?: Schema
): Promise<Buffer[]> => {
  const hashArray: Buffer[] = [];
  const documentFileNames = await documentsInDirectory(undigestedDocumentDir);
  let compile: Ajv.ValidateFunction;
  if (schema) {
    compile = new Ajv().compile(schema);
  }

  documentFileNames.forEach(file => {
    let document;
    if (unwrap) {
      document = getData(readDocumentFile(undigestedDocumentDir, file));
    } else {
      // Read individual document
      document = readDocumentFile(undigestedDocumentDir, file);
    }

    // Digest individual document
    if (compile) {
      const valid = compile(document);
      if (!valid) {
        throw new SchemaValidationError(
          `Document ${path.resolve(undigestedDocumentDir, file)} is not valid against the provided schema`,
          compile.errors ?? [],
          document
        );
      }
    }
    try {
      const digest = wrapDocument(document, { externalSchemaId: schema?.$id, version });
      hashArray.push(utils.hashToBuffer(digest.signature.merkleRoot));
      // Write digested document to new directory
      writeDocumentToDisk(digestedDocumentDir, file, digest);
    } catch (e) {
      if (isSchemaValidationError(e)) {
        throw new SchemaValidationError(
          `Document ${path.resolve(undigestedDocumentDir, file)} is not valid against open-attestation schema`,
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
  digestedDocumentDir: string,
  hashMap: Record<string, { sibling: string; parent: string }>
): Promise<string> => {
  const documentFileNames = await documentsInDirectory(intermediateDir);
  let merkleRoot = "";
  documentFileNames.forEach(file => {
    const document = readDocumentFile(intermediateDir, file);

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

    writeDocumentToDisk(digestedDocumentDir, file, document);
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

export const wrap = async (
  inputDir: string,
  outputDir: string,
  options: { schemaPath?: string; version: "open-attestation/2.0" | "open-attestation/3.0"; unwrap: boolean }
): Promise<string> => {
  // Create output dir
  mkdirp.sync(outputDir);

  // Create intermediate dir
  const { name: intermediateDir, removeCallback } = dirSync({
    unsafeCleanup: true
  });

  // Phase 1: For each document, read content, digest and write to file
  const schema = await loadSchema(options.schemaPath);
  const individualDocumentHashes = await digestDocument(
    inputDir,
    intermediateDir,
    options.version,
    options.unwrap,
    schema
  );

  if (!individualDocumentHashes || individualDocumentHashes.length === 0)
    throw new Error(`No documents found in ${inputDir}`);

  // Phase 2: Efficient merkling to build hashmap
  const hashMap = merkleHashmap(individualDocumentHashes);

  // Phase 3: Add proofs to signedDocuments
  const merkleRoot = await appendProofToDocuments(intermediateDir, outputDir, hashMap);

  // Remove intermediate dir
  removeCallback();

  return merkleRoot;
};
