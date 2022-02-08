/* eslint-disable @typescript-eslint/ban-ts-comment */
import { unwrapIndividualDocuments, Output } from "../implementations/unwrap";
import fs from "fs";
import wrappedFileFixture1 from "./fixture/2.0/wrapped-example.1.json";
import unwrappedFileFixture1 from "./fixture/2.0/unwrapped-example.1.json";
import wrappedFileFixture2 from "./fixture/2.0/wrapped-example.2.json";
import unwrappedFileFixture2 from "./fixture/2.0/unwrapped-example.2.json";

jest.mock("fs");

describe("unwrap", () => {
  describe("unwrapIndividualDocuments", () => {
    it("unwrap a single wrapped document", async () => {
      // @ts-ignore
      jest.spyOn(fs, "lstatSync").mockReturnValue({ isDirectory: () => true });
      jest.spyOn(fs, "readdir").mockImplementation((options, callback) => {
        // @ts-ignore
        return callback(null, ["wrapped-example.1.json"]);
      });
      jest.spyOn(fs, "readFileSync").mockImplementation((path) => {
        // @ts-ignore
        if (path.includes("wrapped-example.1.json")) {
          return JSON.stringify(wrappedFileFixture1);
        }
        return "";
      });
      jest.spyOn(fs, "writeFileSync").mockImplementation((path, document) => {
        if (typeof path !== "string") throw new Error("path is not string");
        if (path.includes("wrapped-example.1.json")) {
          const documentForCompare = JSON.parse(JSON.parse(JSON.stringify(document)));
          // eslint-disable-next-line jest/no-conditional-expect
          expect(documentForCompare).toMatchObject(unwrappedFileFixture1);
          return;
        }
        throw new Error(`unhandled ${path} in spy`);
      });

      const unwrappedDocumentCount = await unwrapIndividualDocuments(
        "./fixture/2.0",
        "./fixture/2.0",
        Output.Directory
      );

      expect(unwrappedDocumentCount).toEqual(1);
    });
  });

  describe("unwrapMultipleDocuments", () => {
    it("unwrap multiple wrapped documents", async () => {
      // @ts-ignore
      jest.spyOn(fs, "lstatSync").mockReturnValue({ isDirectory: () => true });
      jest.spyOn(fs, "readdir").mockImplementation((options, callback) => {
        // @ts-ignore
        return callback(null, ["wrapped-example.1.json", "wrapped-example.2.json"]);
      });
      jest.spyOn(fs, "readFileSync").mockImplementation((path) => {
        // @ts-ignore
        if (path.includes("wrapped-example.1.json")) {
          return JSON.stringify(wrappedFileFixture1);
        }
        // @ts-ignore
        else if (path.includes("wrapped-example.2.json")) {
          return JSON.stringify(wrappedFileFixture2);
        }
        return "";
      });
      jest.spyOn(fs, "writeFileSync").mockImplementation((path, document) => {
        if (typeof path !== "string") throw new Error("path is not string");
        if (path.includes("wrapped-example.1.json")) {
          const documentForCompare = JSON.parse(JSON.parse(JSON.stringify(document)));
          // eslint-disable-next-line jest/no-conditional-expect
          expect(documentForCompare).toMatchObject(unwrappedFileFixture1);
          return;
        } else if (path.includes("wrapped-example.2.json")) {
          const documentForCompare = JSON.parse(JSON.parse(JSON.stringify(document)));
          // eslint-disable-next-line jest/no-conditional-expect
          expect(documentForCompare).toMatchObject(unwrappedFileFixture2);
          return;
        }
        throw new Error(`unhandled ${path} in spy`);
      });

      const unwrappedDocumentCount = await unwrapIndividualDocuments(
        "./fixture/2.0",
        "./fixture/2.0",
        Output.Directory
      );

      expect(unwrappedDocumentCount).toEqual(2);
    });
  });
});
