import { decrypt } from "./decrypt";
import tmp from "tmp";
import { join } from "path";
import { readFileSync } from "fs";

describe("decrypt", () => {
  it("should decrypt a file correctly given the correct decryption key", () => {
    const outputDirectory = tmp.dirSync({ unsafeCleanup: true });
    const output = join(outputDirectory.name, "did-dns-decrypted.json");
    decrypt({
      key: "88da9b9cd61cfc1677ae7e79dba9b3aeba4b40c95f94c950759e76c6210b5402",
      input: "src/__tests__/fixture/did-dns-encrypted.json",
      output,
    });
    const results = readFileSync(output, "utf8");
    const expected = readFileSync("src/__tests__/fixture/did-dns-decrypted.json", "utf8");
    expect(JSON.parse(results)).toStrictEqual(JSON.parse(expected));
    outputDirectory.removeCallback();
  });

  it("should throw when decrypting a file given the wrong decryption key", () => {
    const outputDirectory = tmp.dirSync({ unsafeCleanup: true });
    const output = join(outputDirectory.name, "did-dns-decrypted.json");
    expect(() =>
      decrypt({
        key: "0000000000000000000000000000000000000000000000000000000000000000",
        input: "src/__tests__/fixture/did-dns-encrypted.json",
        output,
      })
    ).toThrow(/Error decrypting message/);
    outputDirectory.removeCallback();
  });

  it("should throw when decrypting a wrongly formatted file", () => {
    const outputDirectory = tmp.dirSync({ unsafeCleanup: true });
    const output = join(outputDirectory.name, "did-dns-decrypted.json");
    expect(() =>
      decrypt({
        key: "0000000000000000000000000000000000000000000000000000000000000000",
        input: "src/__tests__/fixture/did-dns-decrypted.json",
        output,
      })
    ).toThrow(/not found in encrypted document/);
    outputDirectory.removeCallback();
  });
});
