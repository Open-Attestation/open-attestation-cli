import { wrap } from "../wrap";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import { encrypt } from "../encrypt";
import signale from "signale";

const fixtureFolderName = "fixture";
const inputDirectoryName = `${fixtureFolderName}/_tmp_in`;
const outputDirectoryName = `${fixtureFolderName}/_tmp_out`;
const validFileName = `${fixtureFolderName}/valid-open-attestation-document.json`;
const inputDirectory = path.resolve(__dirname, inputDirectoryName);
const outputDirectory = path.resolve(__dirname, outputDirectoryName);

describe("wrap", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeEach(() => {
    fs.mkdirSync(inputDirectory);
    fs.mkdirSync(outputDirectory);
  });
  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    rimraf.sync(inputDirectory);
    rimraf.sync(outputDirectory);
  });
  it("should encrypt document", async () => {
    // create a spy on the warn method to make sure the key is displayed
    const spyWarn = jest.spyOn(signale, "warn");
    // prepare files and copy into the input folder
    fs.copyFileSync(
      path.resolve(__dirname, validFileName),
      path.resolve(__dirname, `${inputDirectoryName}/valid-open-attestation-document.json`)
    );

    encrypt(
      path.resolve(__dirname, `${inputDirectoryName}/valid-open-attestation-document.json`),
      path.resolve(__dirname, `${outputDirectoryName}/valid-open-attestation-document.json`)
    );

    // spy has been called and content has an hexadecimal key made of 64 chars
    expect(spyWarn).toHaveBeenCalledTimes(1);
    expect(spyWarn.mock.calls[0][0]).toStrictEqual(expect.stringMatching(/[0-9,a-f]{64}/));

    // check the content of the file
    const file = JSON.parse(
      fs.readFileSync(`${outputDirectory}/valid-open-attestation-document.json`, { encoding: "utf8" })
    );
    expect(typeof file.cipherText).toBe("string");
    expect(typeof file.iv).toBe("string");
    expect(typeof file.tag).toBe("string");
    expect(file.type).toBe("OPEN-ATTESTATION-TYPE-1");
  });
});
