import fs from "fs";
import path from "path";
import util from "util";

const readdir = util.promisify(fs.readdir);

export const isDir = (path: fs.PathLike): boolean => {
  try {
    const stat = fs.lstatSync(path);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
};

const validExtensions = /(.*)(\.)(opencerts?|json|jsonld|tt|oa)$/;

export const readFile = (filename: string): any => {
  return fs.readFileSync(filename, "utf8");
};

export const readOpenAttestationFile = (filename: string): any => {
  return JSON.parse(readFile(filename));
};

const isValidExtension = (filename: string): boolean => validExtensions.test(filename.toLowerCase());

// this function return the list of path to the documents to process
// only documents with valid extension are returned (opencert, json, tt)
export const documentsInDirectory = async (documentPath: string): Promise<string[]> => {
  const items = isDir(documentPath)
    ? (await readdir(documentPath)).map((filename) => path.join(documentPath, filename))
    : [documentPath];
  return items.filter(isValidExtension);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const writeDocumentToDisk = (destinationDir: string, filename: string, document: any): void => {
  fs.writeFileSync(path.join(path.resolve(destinationDir), filename), JSON.stringify(document, null, 2));
};

export enum Output {
  File,
  Directory,
  StdOut,
}

export const writeOutput = ({
  outputPathType,
  documentPath,
  file,
  document,
}: {
  outputPathType: Output;
  documentPath?: string;
  file: string;
  document: any;
}): void => {
  if (outputPathType === Output.File && documentPath) {
    writeDocumentToDisk(path.parse(documentPath).dir, path.parse(documentPath).base, document);
  } else if (outputPathType === Output.Directory && documentPath) {
    writeDocumentToDisk(documentPath, path.parse(file).base, document);
  } else {
    console.log(JSON.stringify(document, undefined, 2)); // print to console, no file created
  }
};
