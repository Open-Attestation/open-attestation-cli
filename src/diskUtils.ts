import fs from "fs";
import path from "path";
import util from "util";

const readdir = util.promisify(fs.readdir);

const opencertsFileExtensions = [/(.*)(\.)(opencert)$/, /(.*)(\.)(json)$/];

export const readCert = (directory: string, filename: string): any =>
  JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8"));

const isOpenCertFileExtension = (filename: string): boolean =>
  opencertsFileExtensions.some(mask => mask.test(filename.toLowerCase()));

export const documentsInDirectory = async (dir: fs.PathLike): Promise<string[]> => {
  const items = await readdir(dir);
  return items.filter(isOpenCertFileExtension);
};

export const writeCertToDisk = (destinationDir: string, filename: string, document: any): void => {
  fs.writeFileSync(path.join(path.resolve(destinationDir), filename), JSON.stringify(document, null, 2));
};
