import { Output, wrap } from "../implementations/wrap";
import { handler } from "../commands/wrap";
import fs from "fs";
import path from "path";
import signale from "signale";
import { SchemaId } from "@govtechsg/open-attestation";
import tmp from "tmp";

const fixtureFolderName = "fixture";
const validFileName = "valid-open-attestation-document.json";
const invalidFileName = "invalid-open-attestation-document.json";
const wrappedFileName = "wrapped-open-attestation-document.json";

describe("wrap", () => {
  describe("wrap handler arguments check", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    const signaleErrorSpy = jest.spyOn(signale, "error");

    // eslint-disable-next-line jest/no-hooks
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should not allow output as file when input path is a directory", async () => {
      await handler({
        rawDocumentsPath: path.resolve("examples", "raw-documents"),
        openAttestationV3: true,
        unwrap: false,
        outputFile: path.resolve("examples", "wrapped-documents"),
        batched: true,
      });
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(signaleErrorSpy).toHaveBeenCalledWith(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
    });
    it("should not allow output as StdOut when input path is a directory", async () => {
      await handler({
        rawDocumentsPath: path.resolve("examples", "raw-documents"),
        openAttestationV3: true,
        unwrap: false,
        batched: true,
      });
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(signaleErrorSpy).toHaveBeenCalledWith(
        "Output path type can only be directory when using directory as raw documents path, use --output-dir"
      );
    });
  });

  describe("wrap with directory input", () => {
    describe("without schema", () => {
      it("should issue document when folder contain one valid open attestation document", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, validFileName),
          path.resolve(inputDirectory.name, "valid-open-attestation-document.json")
        );
        const merkleRoot = await wrap({
          inputPath: inputDirectory.name,
          outputPath: outputDirectory.name,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document.json"), {
            encoding: "utf8",
          })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should wrap documents when folder contain multiple valid open attestation documents", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, validFileName),
          path.resolve(inputDirectory.name, "valid-open-attestation-document-1.json")
        );
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, validFileName),
          path.resolve(inputDirectory.name, "valid-open-attestation-document-2.json")
        );
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, validFileName),
          path.resolve(inputDirectory.name, "valid-open-attestation-document-3.json")
        );
        const merkleRoot = await wrap({
          inputPath: inputDirectory.name,
          outputPath: outputDirectory.name,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: true,
        });
        const file1 = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document-1.json"), {
            encoding: "utf8",
          })
        );
        const file2 = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document-2.json"), {
            encoding: "utf8",
          })
        );
        const file3 = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document-3.json"), {
            encoding: "utf8",
          })
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
      it("should wrap documents individually when folder contain multiple valid open attestation documents and batch is false", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, validFileName),
          path.resolve(inputDirectory.name, "valid-open-attestation-document-1.json")
        );
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, validFileName),
          path.resolve(inputDirectory.name, "valid-open-attestation-document-2.json")
        );
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, validFileName),
          path.resolve(inputDirectory.name, "valid-open-attestation-document-3.json")
        );
        const merkleRoot = await wrap({
          inputPath: inputDirectory.name,
          outputPath: outputDirectory.name,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: false,
        });
        const file1 = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document-1.json"), {
            encoding: "utf8",
          })
        );
        const file2 = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document-2.json"), {
            encoding: "utf8",
          })
        );
        const file3 = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document-3.json"), {
            encoding: "utf8",
          })
        );
        expect(merkleRoot).toBeUndefined();
        // every file must have a different merkle root
        expect(file1.signature.merkleRoot).not.toStrictEqual(file2.signature.merkleRoot);
        expect(file1.signature.merkleRoot).not.toStrictEqual(file3.signature.merkleRoot);
        expect(file2.signature.merkleRoot).not.toStrictEqual(file3.signature.merkleRoot);
        //every file has targetHash equals to merkleRoot
        expect(file1.signature.targetHash).toStrictEqual(file1.signature.merkleRoot);
        expect(file2.signature.targetHash).toStrictEqual(file2.signature.merkleRoot);
        expect(file3.signature.targetHash).toStrictEqual(file3.signature.merkleRoot);
      });
      it("should not issue document when folder contain one invalid open attestation document", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, invalidFileName),
          path.resolve(inputDirectory.name, "invalid-open-attestation-document.json")
        );

        await expect(
          wrap({
            inputPath: inputDirectory.name,
            outputPath: outputDirectory.name,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "invalid-open-attestation-document.json is not valid against open-attestation schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should not issue documents when folder contain multiple invalid open attestation document", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, invalidFileName),
          path.resolve(__dirname, inputDirectory.name, "invalid-open-attestation-document-1.json")
        );
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, invalidFileName),
          path.resolve(__dirname, inputDirectory.name, "invalid-open-attestation-document-2.json")
        );
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, invalidFileName),
          path.resolve(__dirname, inputDirectory.name, "invalid-open-attestation-document-3.json")
        );

        await expect(
          wrap({
            inputPath: inputDirectory.name,
            outputPath: outputDirectory.name,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "invalid-open-attestation-document-1.json is not valid against open-attestation schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should not issue document when given wrapped document without --unwrap", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, wrappedFileName),
          path.resolve(inputDirectory.name, "wrapped-open-attestation-document.json")
        );

        await expect(
          wrap({
            inputPath: inputDirectory.name,
            outputPath: outputDirectory.name,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "wrapped-open-attestation-document.json is not valid against open-attestation schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should issue document when the given document is wrapped and --unwrap is specified", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, wrappedFileName),
          path.resolve(inputDirectory.name, "wrapped-open-attestation-document.json")
        );

        const merkleRoot = await wrap({
          inputPath: inputDirectory.name,
          outputPath: outputDirectory.name,
          version: SchemaId.v3,
          unwrap: true,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "wrapped-open-attestation-document.json"), {
            encoding: "utf8",
          })
        );

        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
    });
    describe("with schema", () => {
      it("should not issue document when the given document is wrapped and --unwrap is not specified", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, "valid-custom-schema-document.json"),
          path.resolve(inputDirectory.name, "valid-custom-schema-document.json")
        );
        const merkleRoot = await wrap({
          inputPath: inputDirectory.name,
          outputPath: outputDirectory.name,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-custom-schema-document.json"), {
            encoding: "utf8",
          })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue documents when folder contain one valid open attestation that is not valid against the local schema provided", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, "invalid-custom-schema-document.json"),
          path.resolve(inputDirectory.name, "invalid-custom-schema-document.json")
        );
        await expect(
          wrap({
            inputPath: inputDirectory.name,
            outputPath: outputDirectory.name,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "invalid-custom-schema-document.json is not valid against the provided schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should issue documents when folder contain one valid open attestation that is also valid against the remote schema provided", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, "valid-custom-schema-document.json"),
          path.resolve(inputDirectory.name, "valid-custom-schema-document.json")
        );
        const merkleRoot = await wrap({
          inputPath: inputDirectory.name,
          outputPath: outputDirectory.name,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-custom-schema-document.json"), {
            encoding: "utf8",
          })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue documents when folder contain one valid open attestation that is not valid against the remote schema provided", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        fs.copyFileSync(
          path.resolve(__dirname, fixtureFolderName, "invalid-custom-schema-document.json"),
          path.resolve(inputDirectory.name, "invalid-custom-schema-document.json")
        );
        await expect(
          wrap({
            inputPath: inputDirectory.name,
            outputPath: outputDirectory.name,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "invalid-custom-schema-document.json is not valid against the provided schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should not issue documents when schema is not valid", async () => {
        const inputDirectory = tmp.dirSync();
        const outputDirectory = tmp.dirSync();
        await expect(
          wrap({
            inputPath: inputDirectory.name,
            outputPath: outputDirectory.name,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "invalid-schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow("Invalid schema, you must provide an $id property to your schema");
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
    });
  });

  describe("wrap with file input", () => {
    describe("without schema", () => {
      it("should issue document when given valid open attestation document", async () => {
        const outputDirectory = tmp.dirSync();
        const merkleRoot = await wrap({
          inputPath: path.resolve(__dirname, fixtureFolderName, "valid-open-attestation-document.json"),
          outputPath: outputDirectory.name,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-open-attestation-document.json"), {
            encoding: "utf8",
          })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue document when given invalid open attestation document", async () => {
        const outputDirectory = tmp.dirSync();

        await expect(
          wrap({
            inputPath: path.resolve(__dirname, fixtureFolderName, "invalid-open-attestation-document.json"),
            outputPath: outputDirectory.name,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "invalid-open-attestation-document.json is not valid against open-attestation schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should not issue document when given wrapped document without --unwrap", async () => {
        const outputDirectory = tmp.dirSync();

        await expect(
          wrap({
            inputPath: path.resolve(__dirname, fixtureFolderName, "wrapped-open-attestation-document.json"),
            outputPath: outputDirectory.name,
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "wrapped-open-attestation-document.json is not valid against open-attestation schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should issue document when the given wrapped document and --unwrap is specified", async () => {
        const outputDirectory = tmp.dirSync();
        const merkleRoot = await wrap({
          inputPath: path.resolve(__dirname, fixtureFolderName, "wrapped-open-attestation-document.json"),
          outputPath: outputDirectory.name,
          version: SchemaId.v3,
          unwrap: true,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "wrapped-open-attestation-document.json"), {
            encoding: "utf8",
          })
        );

        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should output as file when input path is a file", async () => {
        const outputFile = tmp.fileSync();
        const merkleRoot = await wrap({
          inputPath: path.resolve(__dirname, fixtureFolderName, "valid-open-attestation-document.json"),
          outputPath: outputFile.name,
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.File,
          batched: true,
        });

        const file = JSON.parse(fs.readFileSync(outputFile.name, { encoding: "utf8" }));
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should allow output as StdOut when input path is a file", async () => {
        let stdOut: any;
        jest.spyOn(console, "log").mockImplementation((input) => {
          stdOut = input;
        });
        const merkleRoot = await wrap({
          inputPath: path.resolve(__dirname, fixtureFolderName, "valid-open-attestation-document.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.StdOut,
          batched: true,
        });

        stdOut = JSON.parse(stdOut);
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(stdOut.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(stdOut.signature.targetHash);
      });
    });
    describe("with schema", () => {
      it("should not issue document when the given wrapped document and --unwrap is not specified", async () => {
        const outputDirectory = tmp.dirSync();
        const merkleRoot = await wrap({
          inputPath: path.resolve(__dirname, fixtureFolderName, "valid-custom-schema-document.json"),
          outputPath: outputDirectory.name,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-custom-schema-document.json"), {
            encoding: "utf8",
          })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue document when given valid open attestation document that is not valid against the local schema provided", async () => {
        const outputDirectory = tmp.dirSync();
        await expect(
          wrap({
            inputPath: path.resolve(__dirname, fixtureFolderName, "invalid-custom-schema-document.json"),
            outputPath: outputDirectory.name,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "invalid-custom-schema-document.json is not valid against the provided schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should issue document when given valid open attestation document that is also valid against the remote schema provided", async () => {
        const outputDirectory = tmp.dirSync();
        const merkleRoot = await wrap({
          inputPath: path.resolve(__dirname, fixtureFolderName, "valid-custom-schema-document.json"),
          outputPath: outputDirectory.name,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.Directory,
          batched: true,
        });

        const file = JSON.parse(
          fs.readFileSync(path.resolve(outputDirectory.name, "valid-custom-schema-document.json"), {
            encoding: "utf8",
          })
        );
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
      it("should not issue document when given open attestation document that is not valid against the remote schema provided", async () => {
        const outputDirectory = tmp.dirSync();
        await expect(
          wrap({
            inputPath: path.resolve(__dirname, fixtureFolderName, "invalid-custom-schema-document.json"),
            outputPath: outputDirectory.name,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              "invalid-custom-schema-document.json is not valid against the provided schema"
            ),
          })
        );
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should not issue documents when schema is not valid", async () => {
        const outputDirectory = tmp.dirSync();
        await expect(
          wrap({
            inputPath: path.resolve(__dirname, fixtureFolderName, "valid-open-attestation-document.json"),
            outputPath: outputDirectory.name,
            schemaPath: path.resolve(__dirname, fixtureFolderName, "invalid-schema.json"),
            version: SchemaId.v3,
            unwrap: false,
            outputPathType: Output.Directory,
            batched: true,
          })
        ).rejects.toThrow("Invalid schema, you must provide an $id property to your schema");
        expect(fs.readdirSync(outputDirectory.name)).toHaveLength(0);
      });
      it("should allow output as file if input path is a input file with custom schema", async () => {
        const outputFile = tmp.fileSync();
        const merkleRoot = await wrap({
          inputPath: path.resolve(__dirname, fixtureFolderName, "valid-custom-schema-document.json"),
          outputPath: outputFile.name,
          schemaPath: path.resolve(__dirname, fixtureFolderName, "schema.json"),
          version: SchemaId.v3,
          unwrap: false,
          outputPathType: Output.File,
          batched: true,
        });

        const file = JSON.parse(fs.readFileSync(outputFile.name, { encoding: "utf8" }));
        expect(merkleRoot).toHaveLength(64);
        expect(merkleRoot).toStrictEqual(file.signature.merkleRoot);
        expect(merkleRoot).toStrictEqual(file.signature.targetHash);
      });
    });
  });
});
