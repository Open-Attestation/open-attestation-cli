import { sign } from "../implementations/sign";
import fs from "fs";
import path from "path";
import tmp from "tmp";
import { SUPPORTED_SIGNING_ALGORITHM } from "@govtechsg/open-attestation";

const fixtureFolderName = "fixture";
const wrappedFileName1 = `${fixtureFolderName}/unsigned-did.json`;
const wrappedFileName2 = `${fixtureFolderName}/unsigned-dnsDid.json`;

describe("sign", () => {
  it("should sign documents when folder contain multiple valid open attestation documents", async () => {
    const inputDirectory = tmp.dirSync();
    const outputDirectory = tmp.dirSync();
    fs.copyFileSync(
      path.resolve(__dirname, wrappedFileName1),
      path.resolve(__dirname, `${inputDirectory.name}/did.json`)
    );
    fs.copyFileSync(
      path.resolve(__dirname, wrappedFileName2),
      path.resolve(__dirname, `${inputDirectory.name}/dnsDid.json`)
    );

    await sign({
      rawDocumentsPath: inputDirectory.name,
      outputDir: outputDirectory.name,
      key: "0x0000000000000000000000000000000000000000000000000000000000000003",
      publicKey: "did:ethr:0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69#controller",
      algorithm: SUPPORTED_SIGNING_ALGORITHM.Secp256k1VerificationKey2018,
    });

    const file1 = JSON.parse(fs.readFileSync(`${outputDirectory.name}/did.json`, { encoding: "utf8" }));
    const file2 = JSON.parse(fs.readFileSync(`${outputDirectory.name}/dnsDid.json`, { encoding: "utf8" }));

    expect(file1.proof).toMatchObject([
      {
        proofPurpose: "assertionMethod",
        signature:
          "0x6d0ff5c64b8230cdc471f38267495002f2c762acf7a80250599809ee32b4255377f1adcb56fb712dee66bfeb21be6b5d802f299aea1f1edca129e88e4c1742ce1c",
        type: "OpenAttestationSignature2018",
        verificationMethod: "did:ethr:0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69#controller",
      },
    ]);

    expect(file2.proof).toMatchObject([
      {
        proofPurpose: "assertionMethod",
        signature:
          "0x04b56b7a8405364cc925143c2fc28f91ee7a3e340402ba66e616f275110cbc446e140716f88f418581e02a371d246e1b98f07c937ee9b96d7bc8aebb470345c71b",
        type: "OpenAttestationSignature2018",
        verificationMethod: "did:ethr:0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69#controller",
      },
    ]);
  });
});
