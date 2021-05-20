import {
  transformAdditionalPropertyErrors,
  transformAllowedValuesErrors,
  transformFormatErrors,
  transformRequiredErrors,
} from "./ajvErrorTransformer";
import chalk, { Level } from "chalk";
import Ajv from "ajv";
import addFormats from "ajv-formats";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const compileAjvSchema = (schema: any) => {
  const ajv = new Ajv();
  addFormats(ajv);
  return ajv.compile(schema);
};

describe("errors", () => {
  let level = 0 as Level;
  beforeAll(() => {
    level = chalk.level;
    chalk.level = 0;
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(() => {
    chalk.level = level;
  });

  describe("transformRequiredErrors", () => {
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        key1: { type: "number" },
        key2: {
          type: "object",
          properties: {
            key21: { type: "number" },
            key22: { type: "object", properties: { key221: { type: "number" } }, required: ["key221"] },
          },
          required: ["key21"],
        },
      },
      required: ["key1"],
    };
    it("should return nothing when error is not a required error", () => {
      const validate = compileAjvSchema(schema);
      validate({ key1: "nope" });

      expect(validate.errors).toHaveLength(1);
      expect(transformRequiredErrors(validate.errors ?? [])).toStrictEqual([]);
    });
    it("should return error when missing property is a top level property", () => {
      const validate = compileAjvSchema(schema);
      validate({});

      expect(validate.errors).toHaveLength(1);
      expect(transformRequiredErrors(validate.errors ?? [])).toStrictEqual([
        `The required property "/key1" is missing`,
      ]);
    });
    it("should return error when missing property is a first level deep property", () => {
      const validate = compileAjvSchema(schema);
      validate({ key1: 2, key2: {} });

      expect(validate.errors).toHaveLength(1);
      expect(transformRequiredErrors(validate.errors ?? [])).toStrictEqual([
        `The required property "/key2/key21" is missing`,
      ]);
    });
    it("should return error when missing property is a two levels deep property", () => {
      const validate = compileAjvSchema(schema);
      validate({ key1: 2, key2: { key21: 3, key22: {} } });

      expect(validate.errors).toHaveLength(1);
      expect(transformRequiredErrors(validate.errors ?? [])).toStrictEqual([
        `The required property "/key2/key22/key221" is missing`,
      ]);
    });
  });
  describe("transformAdditionalPropertyErrors", () => {
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        key1: { type: "number" },
        key2: { type: "object", properties: { key21: { type: "number" } }, additionalProperties: false },
      },
      additionalProperties: false,
    };
    it("should return nothing when error is not a additional property error", () => {
      const validate = compileAjvSchema(schema);
      validate({ key1: "10" });
      expect(validate.errors).toHaveLength(1);
      expect(transformAdditionalPropertyErrors(validate.errors ?? [])).toStrictEqual([]);
    });
    it("should return error when additional property is a top level property", () => {
      const validate = compileAjvSchema(schema);
      validate({ bar: 10 });
      expect(transformAdditionalPropertyErrors(validate.errors ?? [])).toStrictEqual([
        `An unexpected additional property with key "bar" was found at the top level object`,
      ]);
    });
    it("should return error when additional property is in a first level deep property", () => {
      const validate = compileAjvSchema(schema);
      validate({ key2: { foo: 10 } });
      expect(transformAdditionalPropertyErrors(validate.errors ?? [])).toStrictEqual([
        `An unexpected additional property with key "foo" was found in object key2`,
      ]);
    });
  });
  describe("transformAllowedValuesErrors", () => {
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        key1: {
          type: "string",
          enum: ["ABC", "DEF"],
        },
        key2: {
          type: "object",
          properties: {
            key21: {
              type: "string",
              enum: ["123", "456"],
            },
          },
        },
      },
    };
    it("should return nothing when error is not a allowed values error", () => {
      const validate = compileAjvSchema(schema);
      validate({ key1: 10 });
      expect(validate.errors).toHaveLength(1);
      expect(transformAllowedValuesErrors(validate.errors ?? [])).toStrictEqual([]);
    });
    it("should return error when allowed values error is in a top level property", () => {
      const validate = compileAjvSchema(schema);
      validate({ key1: "XYZ" });
      expect(transformAllowedValuesErrors(validate.errors ?? [])).toStrictEqual([
        `The provided value at path "/key1" is not one of the allowed values defined by the schema: ABC, DEF`,
      ]);
    });
    it("should return error when allowed values error is in first level deep property", () => {
      const validate = compileAjvSchema(schema);
      validate({ key2: { key21: "ABC" } });

      expect(transformAllowedValuesErrors(validate.errors ?? [])).toStrictEqual([
        `The provided value at path "/key2/key21" is not one of the allowed values defined by the schema: 123, 456`,
      ]);
    });
  });
  describe("transformFormatErrors", () => {
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        key1: {
          type: "string",
          format: "uri",
        },
      },
    };
    it("should return error when property URI format is invalid", () => {
      const validate = compileAjvSchema(schema);
      validate({ key1: "XYZ" });
      expect(transformFormatErrors(validate.errors ?? [])).toStrictEqual([`The property "/key1" is not a valid URI`]);
    });
  });
});
