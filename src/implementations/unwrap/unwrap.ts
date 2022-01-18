import { documentsInDirectory, readOpenAttestationFile, writeDocumentToDisk } from "../utils/disk";
import { dirSync } from "tmp";
import mkdirp from "mkdirp";
import { getData, SchemaId, OpenAttestationDocument } from "@govtechsg/open-attestation";
import path from "path";
import fetch from "node-fetch";
import Ajv, { AnySchemaObject, ErrorObject, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

class SchemaValidationError extends Error {
  constructor(message: string, public validationErrors: ErrorObject[], public document: any) {
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

const remoteLoadSchema = async (uri: string): Promise<AnySchemaObject> => {
  const response = await fetch(uri);
  console.log({ uri });
  const r = await response.json();
  console.log({ uri });
  return r;
};

const ajv = new Ajv({ loadSchema: remoteLoadSchema, allowUnionTypes: true });
addFormats(ajv);
ajv.addKeyword("deprecationMessage");

export const unwrapIndividualDocuments = async (
  undigestedDocumentPath: string,
  digestedDocumentDir: string | undefined,
  version: SchemaId,
  unwrap: boolean,
  outputPathType: Output,
  schema?: Schema
): Promise<OpenAttestationDocument[]> => {
  const oaArray: OpenAttestationDocument[] = [];
  const documentFileNames = await documentsInDirectory(undigestedDocumentPath);
  let compile: ValidateFunction | undefined;
  if (schema) {
    compile = await ajv.compileAsync(schema);
  }

  for (const file of documentFileNames) {
    const unwrappedDocument = getData(readOpenAttestationFile(file));
    oaArray.push(unwrappedDocument);

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
      // Write digested document to new directory
      writeOutput({
        outputPathType,
        digestedDocumentPath: digestedDocumentDir,
        file,
        document: unwrappedDocument,
      });
    } catch (e) {
      throw e;
    }
  }
  return oaArray;
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

interface UnwrapArguments {
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

export const unwrap = async ({
  inputPath,
  outputPath,
  schemaPath,
  version,
  unwrap,
  batched,
  outputPathType,
}: UnwrapArguments): Promise<OpenAttestationDocument[] | undefined> => {
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
  const rawDocumentsArray = await unwrapIndividualDocuments(
    inputPath,
    // if we dont batch document we can directly write to the destination folder. Otherwise we need to output in a temporary folder to compute the merkle root later
    batched ? intermediateDir : outputPath,
    version,
    unwrap,
    batched ? Output.Directory : outputPathType,
    schema
  );

  // Remove intermediate dir
  removeCallback();
  return rawDocumentsArray;
};
