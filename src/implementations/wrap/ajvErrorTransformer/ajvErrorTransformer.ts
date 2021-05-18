import { ErrorObject } from "ajv";
import { highlight } from "../../../utils";
import { EnumError } from "ajv/dist/vocabularies/validation/enum";

const isRequiredParamsError = (params: any) => {
  return params.missingProperty;
};
const isAdditionalPropertiesError = (params: any) => {
  return params.additionalProperty;
};
const isAllowedValuesError = (params: any): params is EnumError => {
  return params.allowedValues;
};
const isFormatUriError = (params: any) => {
  return params.format === "uri";
};

export const transformAdditionalPropertyErrors = (errors: ErrorObject[]): string[] => {
  return errors
    .filter((error) => error.keyword === "additionalProperties")
    .map((error) => {
      if (isAdditionalPropertiesError(error.params)) {
        return `An unexpected additional property with key ${highlight(
          `"${error.params.additionalProperty}"`
        )} was found ${
          error.instancePath ? `in object ${highlight(error.instancePath.substr(1))}` : "at the top level object"
        }`;
      }
      throw new Error("Unexpected error while computing additional property errors");
    });
};

export const transformAllowedValuesErrors = (errors: ErrorObject[]): string[] => {
  return errors
    .filter((error) => error.keyword === "enum")
    .map((error) => {
      if (isAllowedValuesError(error.params)) {
        return `The provided value at path ${highlight(
          `"${error.instancePath}"`
        )} is not one of the allowed values defined by the schema: ${error.params.allowedValues
          .map((allowedValue) => highlight(allowedValue))
          .join(", ")}`;
      }
      throw new Error("Unexpected error while computing allowed values errors");
    });
};

export const transformRequiredErrors = (errors: ErrorObject[]): string[] => {
  return errors
    .filter((error) => error.keyword === "required")
    .map((error) => {
      if (isRequiredParamsError(error.params)) {
        return `The required property ${highlight(
          `"${error.instancePath}/${error.params.missingProperty}"`
        )} is missing`;
      }
      throw new Error("Unexpected error while computing required errors");
    });
};

export const transformFormatErrors = (errors: ErrorObject[]): string[] => {
  return errors
    .filter((error) => error.keyword === "format")
    .map((error) => {
      if (isFormatUriError(error.params)) {
        return `The property ${highlight(`"${error.instancePath}"`)} is not a valid URI`;
      }
      throw new Error("Unexpected error while computing required errors");
    });
};

export const transformValidationErrors = (errors: ErrorObject[]): string[] => {
  const requiredErrors = transformRequiredErrors(errors);
  const additionalPropertyErrors = transformAdditionalPropertyErrors(errors);
  const allowedValuesErrors = transformAllowedValuesErrors(errors);
  const formatErrors = transformFormatErrors(errors);
  const processedErrors =
    requiredErrors.length + additionalPropertyErrors.length + allowedValuesErrors.length + formatErrors.length;
  const additionalError =
    errors.length !== processedErrors
      ? `There ${errors.length - processedErrors > 1 ? "are" : "is"} ${highlight(
          String(errors.length - processedErrors)
        )} unprocessed error${errors.length - processedErrors > 1 ? "s" : ""}`
      : "";
  return [
    ...requiredErrors,
    ...additionalPropertyErrors,
    ...allowedValuesErrors,
    ...formatErrors,
    additionalError,
  ].filter(Boolean);
};
