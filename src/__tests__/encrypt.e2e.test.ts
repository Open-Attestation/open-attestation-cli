import fs from "fs";
import tmp from "tmp";
import path from "path";
import { encrypt } from "../implementations/encrypt";
import signale from "signale";

const fixtureFolderName = "fixture";
const validFileName = `valid-open-attestation-document.json`;

describe("wrap", () => {
  it("should encrypt document", async () => {
    const outputDirectory = tmp.dirSync();

    // create a spy on the warn method to make sure the key is displayed
    const spyWarn = jest.spyOn(signale, "warn");

    encrypt(
      path.resolve(__dirname, fixtureFolderName, validFileName),
      path.resolve(__dirname, outputDirectory.name, validFileName)
    );

    // spy has been called and content has an hexadecimal key made of 64 chars
    expect(spyWarn).toHaveBeenCalledTimes(1);
    expect(spyWarn.mock.calls[0][0]).toStrictEqual(expect.stringMatching(/[0-9,a-f]{64}/));

    // check the content of the file
    const file = JSON.parse(fs.readFileSync(path.resolve(outputDirectory.name, validFileName), { encoding: "utf8" }));
    expect(typeof file.cipherText).toBe("string");
    expect(typeof file.iv).toBe("string");
    expect(typeof file.tag).toBe("string");
    expect(file.type).toBe("OPEN-ATTESTATION-TYPE-1");
  });
});
