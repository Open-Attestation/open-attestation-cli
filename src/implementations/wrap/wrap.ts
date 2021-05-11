import { documentsInDirectory, readOpenAttestationFile, writeDocumentToDisk } from "../utils/disk";
import { dirSync } from "tmp";
import mkdirp from "mkdirp";
import {
  __unsafe__use__it__at__your__own__risks__wrapDocument,
  getData,
  isSchemaValidationError,
  SchemaId,
  utils,
  v3,
  wrapDocument,
} from "@govtechsg/open-attestation";
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
  StdOut,
}

export const wrapIndividualDocuments = async (
  undigestedDocumentPath: string,
  digestedDocumentDir: string | undefined,
  version: SchemaId,
  unwrap: boolean,
  outputPathType: Output,
  schema?: Schema,
  dnsTxt?: string,
  documentStore?: string,
  templateUrl?: string
): Promise<Buffer[]> => {
  const hashArray: Buffer[] = [];
  const documentFileNames = await documentsInDirectory(undigestedDocumentPath);
  let compile: Ajv.ValidateFunction | undefined;
  if (schema) {
    compile = await new Ajv({ loadSchema: remoteLoadSchema }).compileAsync(schema);
  }

  for (const file of documentFileNames) {
    // TODO how to type this
    const document = unwrap ? getData(readOpenAttestationFile(file)) : readOpenAttestationFile(file);
    // Append DNS proof if given
    if (dnsTxt) {
      document.openAttestationMetadata = {
        ...document.openAttestationMetadata,
        identityProof: { identifier: dnsTxt, type: v3.IdentityProofType.DNSTxt },
      };
    }

    // Append document store if given
    if (documentStore) {
      document.openAttestationMetadata = {
        ...document.openAttestationMetadata,
        proof: {
          type: v3.ProofType.OpenAttestationProofMethod,
          method: v3.Method.DocumentStore,
          value: documentStore,
        },
      };
    }

    // Append template url if given
    if (templateUrl) {
      document.openAttestationMetadata = {
        ...document.openAttestationMetadata,
        template: {
          name: "CUSTOM_TEMPLATE",
          type: v3.TemplateType.EmbeddedRenderer,
          url: templateUrl,
        },
      };
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
      let wrappedDocument: any;
      if (version === SchemaId.v3) {
        const digest = await __unsafe__use__it__at__your__own__risks__wrapDocument(document, {
          externalSchemaId: schema?.$id,
          version,
        });
        hashArray.push(utils.hashToBuffer(digest.proof.merkleRoot));
        wrappedDocument = digest;
      } else {
        const digest = wrapDocument(document, { externalSchemaId: schema?.$id, version });
        hashArray.push(utils.hashToBuffer(digest.signature.merkleRoot));
        wrappedDocument = digest;
      }
      // Write digested document to new directory
      writeOutput({
        outputPathType,
        digestedDocumentPath: digestedDocumentDir,
        file,
        document: wrappedDocument,
      });
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
  }
  return hashArray;
};

const writeOutput = ({
  outputPathType,
  digestedDocumentPath,
  file,
  document,
}: {
  outputPathType: Output;
  digestedDocumentPath?: string;
  file: string;
  document: any;
}): void => {
  if (outputPathType === Output.File && digestedDocumentPath) {
    writeDocumentToDisk(path.parse(digestedDocumentPath).dir, path.parse(digestedDocumentPath).base, document);
  } else if (outputPathType === Output.Directory && digestedDocumentPath) {
    writeDocumentToDisk(digestedDocumentPath, path.parse(file).base, document);
  } else {
    console.log(JSON.stringify(document, undefined, 2)); // print to console, no file created
  }
};

export const appendProofToDocuments = async ({
  intermediateDir,
  hashMap,
  outputPathType,
  digestedDocumentPath,
}: {
  intermediateDir: string;
  hashMap: Record<string, { sibling: string; parent: string }>;
  outputPathType: Output;
  digestedDocumentPath?: string;
}): Promise<string> => {
  const documentFileNames = await documentsInDirectory(intermediateDir);
  let merkleRoot = "";

  documentFileNames.forEach((file) => {
    const document = readOpenAttestationFile(file);
    const documentHash = document.signature ? document.signature.targetHash : document.proof.targetHash;
    const proof = [];
    let candidateRoot = documentHash;
    let nextStep = hashMap[documentHash];
    while (nextStep) {
      // nextStep will be empty when there is no parent
      proof.push(nextStep.sibling);
      candidateRoot = nextStep.parent;
      nextStep = hashMap[candidateRoot];
    }
    document.signature ? (document.signature.proof = proof) : (document.proof.proofs = proof);
    document.signature ? (document.signature.merkleRoot = candidateRoot) : (document.proof.merkleRoot = candidateRoot);
    if (!merkleRoot) merkleRoot = candidateRoot;

    writeOutput({ outputPathType, digestedDocumentPath, file, document });
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
        parent: nextHash.toString("hex"),
      };
      hashMap[element2.toString("hex")] = {
        sibling: element1.toString("hex"),
        parent: nextHash.toString("hex"),
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
      .then((response) => response.json())
      .then(checkSchema);
  } else if (schemaPath) {
    return import(path.resolve(schemaPath)).then(checkSchema);
  }
  return Promise.resolve(undefined);
};

const remoteLoadSchema = async (uri: string): Promise<boolean | NodeJS.ReadableStream> => {
  const response = await fetch(uri);
  return response.body;
};

interface WrapArguments {
  inputPath: string;
  outputPath?: string;
  schemaPath?: string;
  version: SchemaId;
  unwrap: boolean;
  batched: boolean;
  outputPathType: Output;
  dnsTxt?: string;
  documentStore?: string;
  templateUrl?: string;
}

export const wrap = async ({
  inputPath,
  outputPath,
  schemaPath,
  version,
  unwrap,
  batched,
  outputPathType,
  dnsTxt,
  documentStore,
  templateUrl,
}: WrapArguments): Promise<string | undefined> => {
  // Create output dir
  if (outputPath) {
    mkdirp.sync(outputPathType === Output.File ? path.parse(outputPath).dir : outputPath);
  }

  // Create intermediate dir
  const { name: intermediateDir, removeCallback } = dirSync({
    unsafeCleanup: true,
  });

  // Phase 1: For each document, read content, digest and write to file
  const schema = await loadSchema(schemaPath);
  const individualDocumentHashes = await wrapIndividualDocuments(
    inputPath,
    // if we dont batch document we can directly write to the destination folder. Otherwise we need to output in a temporary folder to compute the merkle root later
    batched ? intermediateDir : outputPath,
    version,
    unwrap,
    batched ? Output.Directory : outputPathType,
    schema,
    dnsTxt,
    documentStore,
    templateUrl
  );

  if (!individualDocumentHashes || individualDocumentHashes.length === 0)
    throw new Error(`No documents found in ${inputPath}`);

  let merkleRoot: string | undefined;
  if (batched) {
    // Phase 2: Efficient merkling to build hashmap
    const hashMap = merkleHashmap(individualDocumentHashes);

    // Phase 3: Add proofs to signedDocuments
    merkleRoot = await appendProofToDocuments({
      intermediateDir,
      hashMap,
      outputPathType,
      digestedDocumentPath: outputPath,
    });
  }

  // Remove intermediate dir
  removeCallback();
  return merkleRoot;
};
