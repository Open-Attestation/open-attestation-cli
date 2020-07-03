import { sign, Output } from "../implementations/sign";
import fs from "fs";
import path from "path";
import tmp from "tmp";

const fixtureFolderName = "fixture";
const wrappedFileName = `${fixtureFolderName}/wrapped-open-attestation-document.json`;
const wrappedFileNameTwo = `${fixtureFolderName}/wrapped-open-attestation-document-2.json`;

describe("sign", () => {
  describe("sign with directory input", () => {
    // eslint-disable-next-line jest/no-hooks
    it("should sign document when folder contains one valid open attestation document", async () => {
      const inputDirectory = tmp.dirSync();
      const outputDirectory = tmp.dirSync();
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectory.name}/wrapped-open-attestation-document.json`)
      );

      await sign({
        rawDocumentsPath: inputDirectory.name,
        outputPath: outputDirectory.name,
        outputPathType: Output.Directory,
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        publicKey: "0x14791697260E4c9A71f18484C9f997B308e59325"
      });

      const file = JSON.parse(
        fs.readFileSync(`${outputDirectory.name}/wrapped-open-attestation-document.json`, { encoding: "utf8" })
      );

      expect(file).toMatchObject({
        proof: {
          proofPurpose: "assertionMethod",
          signature:
            "0x24ffefc58988bff46074b847b1b47973a39658fde92a845ab51634f5ed4831e047dd8107648761d3b916d603712242871bdccc74437d48a5f57c9b78bfd180281c",
          type: "EcdsaSecp256k1Signature2019",
          verificationMethod: "0x14791697260E4c9A71f18484C9f997B308e59325"
        }
      });
    });
    it("should sign documents when folder contain multiple valid open attestation documents", async () => {
      const inputDirectory = tmp.dirSync();
      const outputDirectory = tmp.dirSync();
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectory.name}/wrapped-open-attestation-document-1.json`)
      );
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileNameTwo),
        path.resolve(__dirname, `${inputDirectory.name}/wrapped-open-attestation-document-2.json`)
      );

      await sign({
        rawDocumentsPath: inputDirectory.name,
        outputPath: outputDirectory.name,
        outputPathType: Output.Directory,
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        publicKey: "0x14791697260E4c9A71f18484C9f997B308e59325"
      });

      const file1 = JSON.parse(
        fs.readFileSync(`${outputDirectory.name}/wrapped-open-attestation-document-1.json`, { encoding: "utf8" })
      );
      const file2 = JSON.parse(
        fs.readFileSync(`${outputDirectory.name}/wrapped-open-attestation-document-2.json`, { encoding: "utf8" })
      );

      expect(file1).toMatchObject({
        proof: {
          proofPurpose: "assertionMethod",
          signature:
            "0x24ffefc58988bff46074b847b1b47973a39658fde92a845ab51634f5ed4831e047dd8107648761d3b916d603712242871bdccc74437d48a5f57c9b78bfd180281c",
          type: "EcdsaSecp256k1Signature2019",
          verificationMethod: "0x14791697260E4c9A71f18484C9f997B308e59325"
        }
      });

      expect(file2).toMatchObject({
        proof: {
          proofPurpose: "assertionMethod",
          signature:
            "0xf4bd905c2ebf829349ffd1cd451bcca9e6ec0d1bb2b16ad0649a2406b271d719642c3825b68102369a9ea9ce355133e5e24a9ef0525b33198b2d4938e474f87d1b",
          type: "EcdsaSecp256k1Signature2019",
          verificationMethod: "0x14791697260E4c9A71f18484C9f997B308e59325"
        }
      });
    });
  });

  describe("sign with file input", () => {
    it("should output as file when input path is a file", async () => {
      const inputDirectory = tmp.dirSync();
      const outputFile = tmp.fileSync();
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectory.name}/wrapped-open-attestation-document.json`)
      );

      await sign({
        rawDocumentsPath: path.resolve(inputDirectory.name, "wrapped-open-attestation-document.json"),
        outputPath: outputFile.name,
        outputPathType: Output.File,
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        publicKey: "0x14791697260E4c9A71f18484C9f997B308e59325"
      });

      const file = JSON.parse(fs.readFileSync(`${outputFile.name}`, { encoding: "utf8" }));

      expect(file).toMatchObject({
        proof: {
          proofPurpose: "assertionMethod",
          signature:
            "0x24ffefc58988bff46074b847b1b47973a39658fde92a845ab51634f5ed4831e047dd8107648761d3b916d603712242871bdccc74437d48a5f57c9b78bfd180281c",
          type: "EcdsaSecp256k1Signature2019",
          verificationMethod: "0x14791697260E4c9A71f18484C9f997B308e59325"
        }
      });
    });

    it("should allow output as StdOut when input path is a file", async () => {
      let stdOut: any;
      jest.spyOn(console, "log").mockImplementation(input => {
        stdOut = input;
      });
      const inputDirectory = tmp.dirSync();
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectory.name}/wrapped-open-attestation-document.json`)
      );
      await sign({
        rawDocumentsPath: path.resolve(inputDirectory.name, "wrapped-open-attestation-document.json"),
        outputPathType: Output.StdOut,
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        publicKey: "0x14791697260E4c9A71f18484C9f997B308e59325"
      });

      expect(JSON.parse(stdOut)).toMatchObject({
        proof: {
          proofPurpose: "assertionMethod",
          signature:
            "0x24ffefc58988bff46074b847b1b47973a39658fde92a845ab51634f5ed4831e047dd8107648761d3b916d603712242871bdccc74437d48a5f57c9b78bfd180281c",
          type: "EcdsaSecp256k1Signature2019",
          verificationMethod: "0x14791697260E4c9A71f18484C9f997B308e59325"
        }
      });
    });
  });
});
