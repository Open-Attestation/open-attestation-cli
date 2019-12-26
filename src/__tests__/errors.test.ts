import { transformAdditionalPropertyErrors, transformAllowedValuesErrors, transformRequiredErrors } from "../errors";
import chalk from "chalk";

describe("errors", () => {
  let level = 0;
  // eslint-disable-next-line jest/no-hooks
  beforeAll(() => {
    level = chalk.level;
    chalk.level = 0;
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(() => {
    chalk.level = level;
  });
  describe("transformRequiredErrors", () => {
    it("should return nothing when error is not a required error", () => {
      expect(
        transformRequiredErrors([{ dataPath: "", keyword: "", schemaPath: "", params: { additionalProperty: "" } }])
      ).toStrictEqual([]);
    });
    it("should return error when missing property is a top level property", () => {
      expect(
        transformRequiredErrors([
          {
            keyword: "required",
            dataPath: "",
            schemaPath: "#/required",
            params: {
              missingProperty: "proof"
            },
            message: "should have required property 'proof'"
          }
        ])
      ).toStrictEqual([`The required property "proof" is missing`]);
    });
    it("should return error when missing property is a first level deep property", () => {
      expect(
        transformRequiredErrors([
          {
            keyword: "required",
            dataPath: ".issuer",
            schemaPath: "#/definitions/issuer/required",
            params: {
              missingProperty: "identityProof"
            },
            message: "should have required property 'identityProof'"
          }
        ])
      ).toStrictEqual([`The required property "issuer.identityProof" is missing`]);
    });
    it("should return error when missing property is a two levels deep property", () => {
      expect(
        transformRequiredErrors([
          {
            keyword: "required",
            dataPath: ".issuer.identityProof",
            schemaPath: "#/definitions/issuer/properties/identityProof/required",
            params: {
              missingProperty: "location"
            },
            message: "should have required property 'location'"
          }
        ])
      ).toStrictEqual([`The required property "issuer.identityProof.location" is missing`]);
    });
  });
  describe("transformAdditionalPropertyErrors", () => {
    it("should return nothing when error is not a additional property error", () => {
      expect(
        transformAdditionalPropertyErrors([
          { dataPath: "", keyword: "", schemaPath: "", params: { additionalProperty: "" } }
        ])
      ).toStrictEqual([]);
    });
    it("should return error when additional property is a top level property", () => {
      expect(
        transformAdditionalPropertyErrors([
          {
            keyword: "additionalProperties",
            dataPath: "",
            schemaPath: "#/properties/template/additionalProperties",
            params: {
              additionalProperty: "foo"
            },
            message: "should NOT have additional properties"
          }
        ])
      ).toStrictEqual([`An unexpected additional property with key "foo" was found at the top level object`]);
    });
    it("should return error when additional property is in a first level deep property", () => {
      expect(
        transformAdditionalPropertyErrors([
          {
            keyword: "additionalProperties",
            dataPath: ".template",
            schemaPath: "#/properties/template/additionalProperties",
            params: {
              additionalProperty: "foo"
            },
            message: "should NOT have additional properties"
          }
        ])
      ).toStrictEqual([`An unexpected additional property with key "foo" was found in object template`]);
    });
  });
  describe("transformAllowedValuesErrors", () => {
    it("should return nothing when error is not a allowder values error", () => {
      expect(
        transformAllowedValuesErrors([
          { dataPath: "", keyword: "", schemaPath: "", params: { additionalProperty: "" } }
        ])
      ).toStrictEqual([]);
    });
    it("should return error when allowed values error is in a top level property", () => {
      expect(
        transformAllowedValuesErrors([
          {
            keyword: "enum",
            dataPath: ".foo",
            schemaPath: "#/properties/template/properties/type/enum",
            params: {
              allowedValues: ["ABC", "DEF"]
            },
            message: "should be equal to one of the allowed values"
          }
        ])
      ).toStrictEqual([
        `The provided value at path "foo" is not one of the allowed values defined by the schema: ABC, DEF`
      ]);
    });
    it("should return error when allowed values error is in first level deep property", () => {
      expect(
        transformAllowedValuesErrors([
          {
            keyword: "enum",
            dataPath: ".template.type",
            schemaPath: "#/properties/template/properties/type/enum",
            params: {
              allowedValues: ["EMBEDDED_RENDERER"]
            },
            message: "should be equal to one of the allowed values"
          }
        ])
      ).toStrictEqual([
        `The provided value at path "template.type" is not one of the allowed values defined by the schema: EMBEDDED_RENDERER`
      ]);
    });
  });
});
