import { sign, Output } from "../implementations/sign";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";

const fixtureFolderName = "fixture";
const wrappedFileName = `${fixtureFolderName}/wrapped-open-attestation-document.json`;
const wrappedFileNameTwo = `${fixtureFolderName}/wrapped-open-attestation-document-2.json`;

const inputDirectoryName = `${fixtureFolderName}/_sign_tmp_in`;
const outputDirectoryName = `${fixtureFolderName}/_sign_tmp_out`;
const inputDirectory = path.resolve(__dirname, inputDirectoryName);
const outputDirectory = path.resolve(__dirname, outputDirectoryName);

// separate set of temp folders use for second test to prevent race condition between rimraf
const inputDirectoryNameTwo = `${fixtureFolderName}/_sign_tmp_in_two`;
const outputDirectoryNameTwo = `${fixtureFolderName}/_sign_tmp_out_two`;
const inputDirectoryTwo = path.resolve(__dirname, inputDirectoryNameTwo);
const outputDirectoryTwo = path.resolve(__dirname, outputDirectoryNameTwo);
const fullOutputFilePath = path.resolve(outputDirectoryTwo, "_tmp_output_file.json");

describe("sign", () => {
  describe("sign with directory input", () => {
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

    it("should sign document when folder contains one valid open attestation document", async () => {
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectoryName}/wrapped-open-attestation-document.json`)
      );

      await sign({
        rawDocumentsPath: inputDirectory,
        outputPath: outputDirectory,
        outputPathType: Output.Directory,
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        publicKey: "0x14791697260E4c9A71f18484C9f997B308e59325"
      });

      const file = JSON.parse(
        fs.readFileSync(`${outputDirectory}/wrapped-open-attestation-document.json`, { encoding: "utf8" })
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
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectoryName}/wrapped-open-attestation-document-1.json`)
      );
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileNameTwo),
        path.resolve(__dirname, `${inputDirectoryName}/wrapped-open-attestation-document-2.json`)
      );

      await sign({
        rawDocumentsPath: inputDirectory,
        outputPath: outputDirectory,
        outputPathType: Output.Directory,
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        publicKey: "0x14791697260E4c9A71f18484C9f997B308e59325"
      });

      const file1 = JSON.parse(
        fs.readFileSync(`${outputDirectory}/wrapped-open-attestation-document-1.json`, { encoding: "utf8" })
      );
      const file2 = JSON.parse(
        fs.readFileSync(`${outputDirectory}/wrapped-open-attestation-document-2.json`, { encoding: "utf8" })
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

    it("should output as file when input path is a file", async () => {
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectoryNameTwo}/wrapped-open-attestation-document.json`)
      );

      await sign({
        rawDocumentsPath: path.resolve(inputDirectoryTwo, "wrapped-open-attestation-document.json"),
        outputPath: fullOutputFilePath,
        outputPathType: Output.File,
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        publicKey: "0x14791697260E4c9A71f18484C9f997B308e59325"
      });

      const file = JSON.parse(fs.readFileSync(`${outputDirectoryTwo}/_tmp_output_file.json`, { encoding: "utf8" }));

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
      fs.copyFileSync(
        path.resolve(__dirname, wrappedFileName),
        path.resolve(__dirname, `${inputDirectoryNameTwo}/wrapped-open-attestation-document.json`)
      );
      await sign({
        rawDocumentsPath: path.resolve(inputDirectoryTwo, "wrapped-open-attestation-document.json"),
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
