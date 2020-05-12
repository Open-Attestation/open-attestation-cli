import { Output, wrap } from "../implementations/wrap";
import { handler } from "../commands/wrap";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import signale from "signale";
import { SchemaId } from "@govtechsg/open-attestation";

const fixtureFolderName = "fixture";
const validFileName = `${fixtureFolderName}/valid-open-attestation-document.json`;
const invalidFileName = `${fixtureFolderName}/invalid-open-attestation-document.json`;
const wrappedFileName = `${fixtureFolderName}/wrapped-open-attestation-document.json`;

const inputDirectoryName = `${fixtureFolderName}/_tmp_in`;
const outputDirectoryName = `${fixtureFolderName}/_tmp_out`;
const inputDirectory = path.resolve(__dirname, inputDirectoryName);
const outputDirectory = path.resolve(__dirname, outputDirectoryName);

// separate set of temp folders use for second test to prevent race condition between rimraf
const inputDirectoryNameTwo = `${fixtureFolderName}/_tmp_in_two`;
const outputDirectoryNameTwo = `${fixtureFolderName}/_tmp_out_two`;
const inputDirectoryTwo = path.resolve(__dirname, inputDirectoryNameTwo);
const outputDirectoryTwo = path.resolve(__dirname, outputDirectoryNameTwo);
const fullOutputFilePathTwo = path.resolve(outputDirectoryTwo, "_tmp_output_file.json");

describe("wrap", () => {
  describe("wrap handler arguments check", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    const signaleErrorSpy = jest.spyOn(signale, "error");

    it("should not allow output as file when input path is a directory", async () => {
      await handler({
        rawDocumentsPath: "examples/raw-documents",
        openAttestationV3: true,
        unwrap: false,
        outputFile: "examples/wrapped-documents"
      });
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(signaleErrorSpy).toHaveBeenCalledWith(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
    });
    it("should not allow output as StdOut when input path is a directory", async () => {
      await handler({
        rawDocumentsPath: "examples/raw-documents",
        openAttestationV3: true,
        unwrap: false
      });
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(signaleErrorSpy).toHaveBeenCalledWith(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
    });
  });

  describe("wrap with directory input", () => {
    // eslint-disable-next-line jest/no-hooks
    beforeEach(() => {
      rimraf.sync(inputDirectory);
      rimraf.sync(outputDirectory);
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
        const merkleRoot = await wrap({
          inputPath: inputDirectory,
          outputPath: outputDirectory,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory
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
        const merkleRoot = await wrap({
          inputPath: inputDirectory,
          outputPath: outputDirectory,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory
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
          wrap({
            inputPath: inputDirectory,
            outputPath: outputDirectory,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
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
          wrap({
            inputPath: inputDirectory,
            outputPath: outputDirectory,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
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
          wrap({
            inputPath: inputDirectory,
            outputPath: outputDirectory,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
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

        const merkleRoot = await wrap({
          inputPath: inputDirectory,
          outputPath: outputDirectory,
          version: SchemaId.v3,
          unwrap: true,
          outputPathType: Output.Directory
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
        const merkleRoot = await wrap({
          inputPath: inputDirectory,
          outputPath: outputDirectory,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory
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
          wrap({
            inputPath: inputDirectory,
            outputPath: outputDirectory,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
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
        const merkleRoot = await wrap({
          inputPath: inputDirectory,
          outputPath: outputDirectory,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory
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
          wrap({
            inputPath: inputDirectory,
            outputPath: outputDirectory,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
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
          wrap({
            inputPath: inputDirectory,
            outputPath: outputDirectory,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "invalid-schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
        ).rejects.toThrow("Invalid schema, you must provide an $id property to your schema");
        expect(fs.readdirSync(outputDirectory)).toHaveLength(0);
      });
    });
  });

  describe("wrap with file input", () => {
    // eslint-disable-next-line jest/no-hooks
    beforeEach(() => {
      rimraf.sync(inputDirectoryTwo);
      rimraf.sync(outputDirectoryTwo);
      fs.mkdirSync(inputDirectoryTwo);
      fs.mkdirSync(outputDirectoryTwo);
    });
    // eslint-disable-next-line jest/no-hooks
    afterEach(() => {
      rimraf.sync(inputDirectoryTwo);
      rimraf.sync(outputDirectoryTwo);
    });
    describe("without schema", () => {
      it("should issue document when given valid open attestation document", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, validFileName),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/valid-open-attestation-document.json`)
        );
        const merkleRoot = await wrap({
          inputPath: path.resolve(inputDirectoryTwo, "valid-open-attestation-document.json"),
          outputPath: outputDirectoryTwo,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectoryTwo}/valid-open-attestation-document.json`, { encoding: "utf8" })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue document when given invalid open attestation document", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, invalidFileName),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/invalid-open-attestation-document.json`)
        );

        await expect(
          wrap({
            inputPath: path.resolve(inputDirectoryTwo, "invalid-open-attestation-document.json"),
            outputPath: outputDirectoryTwo,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in_two/invalid-open-attestation-document.json is not valid against open-attestation schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectoryTwo)).toHaveLength(0);
      });
      it("should not issue document when given wrapped document without --unwrap", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, wrappedFileName),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/wrapped-open-attestation-document.json`)
        );

        await expect(
          wrap({
            inputPath: path.resolve(inputDirectoryTwo, "wrapped-open-attestation-document.json"),
            outputPath: outputDirectoryTwo,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in_two/wrapped-open-attestation-document.json is not valid against open-attestation schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectoryTwo)).toHaveLength(0);
      });

      it("should issue document when the given wrapped document and --unwrap is specified", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, wrappedFileName),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/wrapped-open-attestation-document.json`)
        );

        const merkleRoot = await wrap({
          inputPath: path.resolve(inputDirectoryTwo, "wrapped-open-attestation-document.json"),
          outputPath: outputDirectoryTwo,
          version: SchemaId.v3,
          unwrap: true,
          outputPathType: Output.Directory
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectoryTwo}/wrapped-open-attestation-document.json`, { encoding: "utf8" })
        );

        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should output as file when input path is a file", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, validFileName),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/valid-open-attestation-document.json`)
        );
        const merkleRoot = await wrap({
          inputPath: path.resolve(inputDirectoryTwo, "valid-open-attestation-document.json"),
          outputPath: fullOutputFilePathTwo,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.File
        });

        const file = JSON.parse(fs.readFileSync(fullOutputFilePathTwo, { encoding: "utf8" }));
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should allow output as StdOut when input path is a file", async () => {
        let stdOut: any;
        jest.spyOn(console, "log").mockImplementation(input => {
          stdOut = JSON.parse(JSON.stringify(input));
        });
        fs.copyFileSync(
          path.resolve(__dirname, validFileName),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/valid-open-attestation-document.json`)
        );
        const merkleRoot = await wrap({
          inputPath: path.resolve(inputDirectoryTwo, "valid-open-attestation-document.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.StdOut
        });
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(stdOut.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(stdOut.signature.targetHash);
      });
    });
    describe("with schema", () => {
      it("should not issue document when the given wrapped document and --unwrap is not specified", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/valid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/valid-custom-schema-document.json`)
        );
        const merkleRoot = await wrap({
          inputPath: path.resolve(inputDirectoryTwo, "valid-custom-schema-document.json"),
          outputPath: outputDirectoryTwo,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectoryTwo}/valid-custom-schema-document.json`, { encoding: "utf8" })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue document when given valid open attestation document that is not valid against the local schema provided", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/invalid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/invalid-custom-schema-document.json`)
        );
        await expect(
          wrap({
            inputPath: path.resolve(inputDirectoryTwo, "invalid-custom-schema-document.json"),
            outputPath: outputDirectoryTwo,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in_two/invalid-custom-schema-document.json is not valid against the provided schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectoryTwo)).toHaveLength(0);
      });
      it("should issue document when given valid open attestation document that is also valid against the remote schema provided", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/valid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/valid-custom-schema-document.json`)
        );
        const merkleRoot = await wrap({
          inputPath: path.resolve(inputDirectoryTwo, "valid-custom-schema-document.json"),
          outputPath: outputDirectoryTwo,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory
        });

        const file = JSON.parse(
          fs.readFileSync(`${outputDirectoryTwo}/valid-custom-schema-document.json`, { encoding: "utf8" })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue document when given open attestation document that is not valid against the remote schema provided", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/invalid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/invalid-custom-schema-document.json`)
        );
        await expect(
          wrap({
            inputPath: path.resolve(inputDirectoryTwo, "invalid-custom-schema-document.json"),
            outputPath: outputDirectoryTwo,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "src/__tests__/fixture/_tmp_in_two/invalid-custom-schema-document.json is not valid against the provided schema"
            )
          })
        );
        expect(fs.readdirSync(outputDirectoryTwo)).toHaveLength(0);
      });
      it("should not issue documents when schema is not valid", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/valid-open-attestation-document.json`),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/valid-open-attestation-document.json`)
        );
        await expect(
          wrap({
            inputPath: path.resolve(inputDirectoryTwo, "valid-open-attestation-document.json"),
            outputPath: outputDirectoryTwo,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "invalid-schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory
          })
        ).rejects.toThrow("Invalid schema, you must provide an $id property to your schema");
        expect(fs.readdirSync(outputDirectoryTwo)).toHaveLength(0);
      });
      it("should allow output as file if input path is a input file with custom schema", async () => {
        fs.copyFileSync(
          path.resolve(__dirname, `${fixtureFolderName}/valid-custom-schema-document.json`),
          path.resolve(__dirname, `${inputDirectoryNameTwo}/valid-custom-schema-document.json`)
        );
        const merkleRoot = await wrap({
          inputPath: path.resolve(inputDirectoryTwo, "valid-custom-schema-document.json"),
          outputPath: fullOutputFilePathTwo,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.File
        });

        const file = JSON.parse(fs.readFileSync(fullOutputFilePathTwo, { encoding: "utf8" }));
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
    });
  });
});
