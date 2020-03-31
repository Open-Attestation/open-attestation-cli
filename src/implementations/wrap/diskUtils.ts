import fs from "fs";
import path from "path";
import util from "util";

const readdir = util.promisify(fs.readdir);

const validExtensions = [/(.*)(\.)(opencert)$/, /(.*)(\.)(json)$/];

export const readDocumentFile = (directory: string, filename: string): any =>
  JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8"));

const isValidExtension = (filename: string): boolean => validExtensions.some(mask => mask.test(filename.toLowerCase()));

export const documentsInDirectory = async (dir: fs.PathLike): Promise<string[]> => {
  const items = await readdir(dir);
  return items.filter(isValidExtension);
};

export const writeDocumentToDisk = (destinationDir: string, filename: string, document: any): void => {
  fs.writeFileSync(path.join(path.resolve(destinationDir), filename), JSON.stringify(document, null, 2));
};
