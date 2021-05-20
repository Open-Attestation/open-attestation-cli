import { handler } from "../commands/wrap";
import fs from "fs";
import path from "path";
import tmp from "tmp";
import signale from "signale";

const fixtureFolderName = path.join("fixture", "2.0");
const validFileName = "example.0.json";
const exampleFolderPath = path.resolve("examples", "v2", "raw-documents", validFileName);
const validFileNameWithCustomSchema = "valid-custom-schema-document.json";

describe("wrap with file input", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const signaleSuccessSpy = jest.spyOn(signale, "success");
  describe("without custom schema", () => {
    it("should allow output when given valid open attestation document", async () => {
      const outputFile = tmp.fileSync();
      await handler({
        rawDocumentsPath: exampleFolderPath,
        outputFile: outputFile.name,
        openAttestationV3: false,
        unwrap: false,
        batched: true,
      });
      const file = JSON.parse(
        fs.readFileSync(path.resolve(outputFile.name), {
          encoding: "utf8",
        })
      );
      expect(file.signature.merkleRoot).toBeTruthy();
      expect(file.signature.targetHash).toBeTruthy();
      expect(signaleSuccessSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe("with custom schema", () => {
    it("should allow output as file if input path is an input file with custom schema", async () => {
      const outputFile = tmp.fileSync();
      await handler({
        rawDocumentsPath: path.resolve(__dirname, fixtureFolderName, validFileNameWithCustomSchema),
        outputFile: outputFile.name,
        schema: path.resolve(__dirname, fixtureFolderName, "custom-schema.json"),
        openAttestationV3: false,
        unwrap: false,
        batched: true,
      });
      const file = JSON.parse(
        fs.readFileSync(path.resolve(outputFile.name), {
          encoding: "utf8",
        })
      );
      expect(file.signature.merkleRoot).toBeTruthy();
      expect(file.signature.targetHash).toBeTruthy();
      expect(signaleSuccessSpy).toHaveBeenCalledTimes(1);
    });
  });
});
