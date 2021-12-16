import fs from "fs";
import { prompt } from "inquirer";
import tmp from "tmp";
import { deployDocumentStore } from "../../deploy/document-store/document-store";
import { deployTokenRegistry } from "../../deploy/token-registry/token-registry";
import { handler as createTempDNS } from "../../../commands/dns/txt-record/create";
import { CreateConfigCommand } from "../../../commands/config/config.type";
import { create as createConfig } from "../create";
import inputConfigFile from "./input-config-file.json";
import expectedConfigFileOutput from "./expected-config-file-output.json";

const mockInputConfigFile = inputConfigFile;

jest.mock("inquirer");
jest.mock("../../../implementations/deploy/document-store/document-store", () => ({
  deployDocumentStore: jest.fn(),
}));
jest.mock("../../../implementations/deploy/token-registry/token-registry", () => ({
  deployTokenRegistry: jest.fn(),
}));
jest.mock("../../../commands/dns/txt-record/create", () => ({
  handler: jest.fn(),
}));
jest.mock(`node-fetch`, () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const generateResponse = () => {
    return {
      json: () => mockInputConfigFile,
    };
  };
  return jest.fn().mockResolvedValue(generateResponse());
});

const mockCreateTempDNS = createTempDNS as jest.Mock;
const mockDeployDocumentStore = deployDocumentStore as jest.Mock;
const mockDeployTokenRegistry = deployTokenRegistry as jest.Mock;

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock = prompt as jest.Mock;

let folder: any;
let args: CreateConfigCommand;

describe("create config file", () => {
  beforeEach(() => {
    folder = tmp.dirSync();
    args = {
      outputDir: folder.name,
      encryptedWalletPath: "src/implementations/config/__tests__/wallet.json",
      configTemplatePath: "",
      configTemplateUrl: "",
    };
  });

  afterEach(() => {
    promptMock.mockRestore();
  });

  it("should create a config file with correct values when using configTemplatePath", async () => {
    promptMock.mockReturnValue({
      password: "password",
    });
    mockDeployDocumentStore.mockReturnValue({ contractAddress: "0xC378aBE13cf18a64fB2f913647bd4Fe054C9eaEd" });
    mockDeployTokenRegistry.mockReturnValue({ contractAddress: "0x620c1DC991E3E2585aFbaA61c762C0369D70C89D" });
    mockCreateTempDNS.mockReturnValue("alert-cyan-stoat.sandbox.openattestation.com");

    args.configTemplatePath = "src/implementations/config/__tests__/input-config-file.json";

    await createConfig(args);
    const configFileAsString = fs.readFileSync(`${folder.name}/config.json`, "utf-8");

    expect(JSON.parse(configFileAsString)).toStrictEqual(expectedConfigFileOutput);
  });

  it("should create a config file with correct values when using configTemplateUrl", async () => {
    promptMock.mockReturnValue({
      password: "password",
    });
    mockDeployDocumentStore.mockReturnValue({ contractAddress: "0xC378aBE13cf18a64fB2f913647bd4Fe054C9eaEd" });
    mockDeployTokenRegistry.mockReturnValue({ contractAddress: "0x620c1DC991E3E2585aFbaA61c762C0369D70C89D" });
    mockCreateTempDNS.mockReturnValue("alert-cyan-stoat.sandbox.openattestation.com");

    args.configTemplateUrl = "https://example.com";

    await createConfig(args);
    const configFileAsString = fs.readFileSync(`${folder.name}/config.json`, "utf-8");

    expect(JSON.parse(configFileAsString)).toStrictEqual(expectedConfigFileOutput);
  });

  it("should throw an error when detected config file with wrong form type", async () => {
    args.configTemplatePath = "src/implementations/config/__tests__/error-config-file.json";

    await expect(createConfig(args)).rejects.toHaveProperty(
      "message",
      "Invalid form detected in config file, please update the form before proceeding."
    );
  });
});
