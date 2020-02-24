import { wrap } from "../wrap";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";

const fixtureFolderName = "fixture";
const inputDirectoryName = `${fixtureFolderName}/_tmp_in`;
const outputDirectoryName = `${fixtureFolderName}/_tmp_out`;
const validFileName = `${fixtureFolderName}/valid-open-attestation-document.json`;
const invalidFileName = `${fixtureFolderName}/invalid-open-attestation-document.json`;
const wrappedFileName = `${fixtureFolderName}/wrapped-open-attestation-document.json`;
const inputDirectory = path.resolve(__dirname, inputDirectoryName);
const outputDirectory = path.resolve(__dirname, outputDirectoryName);

describe("wrap", () => {
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
    describe("without schema", () => {
      it("should issue document when folder contain one valid open attestation document", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, validFileName),
          path.resolve(__dirname, `${inputDirectoryName}/valid-open-attestation-document.json`)
        );
        const merkleRoot = await wrap(inputDirectory, outputDirectory, {
          version: "open-attestation/3.0",
          unwrap: false
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectory}/valid-open-attestation-document.json`, { encoding: "utf8" })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should issue documents when folder contain multiple valid open attestation documents", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, validFileName),
          path.resolve(__dirname, `${inputDirectoryName}/valid-open-attestation-document-1.json`)
        );
        fs.copyFileSync(
          path.resolve(__dirname, validFileName),
          path.resolve(__dirname, `${inputDirectoryName}/valid-open-attestation-document-2.json`)
        );
        fs.copyFileSync(
          path.resolve(__dirname, validFileName),
          path.resolve(__dirname, `${inputDirectoryName}/valid-open-attestation-document-3.json`)
        );
        const merkleRoot = await wrap(inputDirectory, outputDirectory, {
          version: "open-attestation/3.0",
          unwrap: false
        });
        const file1 = JSON.parse(
          fs.readFileSync(`${outputDirectory}/valid-open-attestation-document-1.json`, { encoding: "utf8" })
        );
        const file2 = JSON.parse(
          fs.readFileSync(`${outputDirectory}/valid-open-attestation-document-2.json`, { encoding: "utf8" })
        );
        const file3 = JSON.parse(
          fs.readFileSync(`${outputDirectory}/valid-open-attestation-document-3.json`, { encoding: "utf8" })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file1.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file2.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file3.signature.merkleRoot);
        expect(merkleRoot).not.toStrictEqual(file1.signature.targetHash);
        expect(merkleRoot).not.toStrictEqual(file2.signature.targetHash);
        expect(merkleRoot).not.toStrictEqual(file3.signature.targetHash);
        expect(file1.signature.targetHash).not.toStrictEqual(file2.signature.targetHash);
        expect(file1.signature.targetHash).not.toStrictEqual(file3.signature.targetHash);
        expect(file2.signature.targetHash).not.toStrictEqual(file3.signature.targetHash);
      });
      it("should not issue document when folder contain one invalid open attestation document", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, invalidFileName),
          path.resolve(__dirname, `${inputDirectoryName}/invalid-open-attestation-document.json`)
        );

        await expect(
          wrap(inputDirectory, outputDirectory, { version: "open-attestation/3.0", unwrap: false })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in/invalid-open-attestation-document.json is not valid against open-attestation schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectory)).toHaveLength(0);
      });
      it("should not issue documents when folder contain multiple invalid open attestation document", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, invalidFileName),
          path.resolve(__dirname, `${inputDirectoryName}/invalid-open-attestation-document-1.json`)
        );
        fs.copyFileSync(
          path.resolve(__dirname, invalidFileName),
          path.resolve(__dirname, `${inputDirectoryName}/invalid-open-attestation-document-2.json`)
        );
        fs.copyFileSync(
          path.resolve(__dirname, invalidFileName),
          path.resolve(__dirname, `${inputDirectoryName}/invalid-open-attestation-document-3.json`)
        );

        await expect(
          wrap(inputDirectory, outputDirectory, { version: "open-attestation/3.0", unwrap: false })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in/invalid-open-attestation-document-1.json is not valid against open-attestation schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectory)).toHaveLength(0);
      });
      it("should not issue document when given wrapped document without --unwrap", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, wrappedFileName),
          path.resolve(__dirname, `${inputDirectoryName}/wrapped-open-attestation-document.json`)
        );

        await expect(
          wrap(inputDirectory, outputDirectory, {
            version: "open-attestation/3.0",
            unwrap: false
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in/wrapped-open-attestation-document.json is not valid against open-attestation schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectory)).toHaveLength(0);
      });

      it("should issue document when the given document is wrapped and --unwrap is specified", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, wrappedFileName),
          path.resolve(__dirname, `${inputDirectoryName}/wrapped-open-attestation-document.json`)
        );

        const merkleRoot = await wrap(inputDirectory, outputDirectory, {
          version: "open-attestation/3.0",
          unwrap: true
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectory}/wrapped-open-attestation-document.json`, { encoding: "utf8" })
        );

        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
    });
    describe("with schema", () => {
      it("should not issue document when the given document is wrapped and --unwrap is not specified", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/valid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryName}/valid-custom-schema-document.json`)
        );
        const merkleRoot = await wrap(inputDirectory, outputDirectory, {
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: "open-attestation/3.0",
          unwrap: false
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectory}/valid-custom-schema-document.json`, { encoding: "utf8" })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue documents when folder contain one valid open attestation that is not valid against the local schema provided", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/invalid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryName}/invalid-custom-schema-document.json`)
        );
        await expect(
          wrap(inputDirectory, outputDirectory, {
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: "open-attestation/3.0",
            unwrap: false
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in/invalid-custom-schema-document.json is not valid against the provided schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectory)).toHaveLength(0);
      });
      it("should issue documents when folder contain one valid open attestation that is also valid against the remote schema provided", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/valid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryName}/valid-custom-schema-document.json`)
        );
        const merkleRoot = await wrap(inputDirectory, outputDirectory, {
          schemaPath:
            "https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json",
          version: "open-attestation/3.0",
          unwrap: false
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectory}/valid-custom-schema-document.json`, { encoding: "utf8" })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue documents when folder contain one valid open attestation that is not valid against the remote schema provided", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/invalid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryName}/invalid-custom-schema-document.json`)
        );
        await expect(
          wrap(inputDirectory, outputDirectory, {
            schemaPath:
              "https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json",
            version: "open-attestation/3.0",
            unwrap: false
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in/invalid-custom-schema-document.json is not valid against the provided schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectory)).toHaveLength(0);
      });
      it("should not issue documents when schema is not valid", async () => {
        await expect(
          wrap(inputDirectory, outputDirectory, {
            schemaPath: path.resolve(__dirname, fixtureFolderName, "invalid-schema.json"),
            version: "open-attestation/3.0",
            unwrap: false
          })
        ).rejects.toThrow("Invalid schema, you must provide an $id property to your schema");
        expect(fs.readdirSync(outputDirectory)).toHaveLength(0);
      });
    });
  });
});
