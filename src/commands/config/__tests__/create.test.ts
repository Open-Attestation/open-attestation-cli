import fs from "fs";
import { prompt } from "inquirer";
import tmp from "tmp";
import { deployDocumentStore } from "../../../implementations/deploy/document-store/document-store";
import { deployTokenRegistry } from "../../../implementations/deploy/token-registry/token-registry";
import { handler as createTempDNS } from "../../dns/txt-record/create";
import { CreateConfigCommand } from "../config.type";
import { handler as createConfig } from "../create";
import updatedConfig from "./updated-config.json";

jest.mock("inquirer");
jest.mock("../../../implementations/deploy/document-store/document-store", () => ({
  deployDocumentStore: jest.fn(),
}));
jest.mock("../../../implementations/deploy/token-registry/token-registry", () => ({
  deployTokenRegistry: jest.fn(),
}));
jest.mock("../../dns/txt-record/create", () => ({
  handler: jest.fn(),
}));

const mockCreateTempDNS = createTempDNS as jest.Mock;
const mockDeployDocumentStore = deployDocumentStore as jest.Mock;
const mockDeployTokenRegistry = deployTokenRegistry as jest.Mock;

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock = prompt as jest.Mock;

let folder: any;
let args: CreateConfigCommand;

describe("config-file", () => {
  beforeEach(() => {
    folder = tmp.dirSync();
    args = {
      outputDir: folder.name,
      encryptedWalletPath: "src/commands/config/__tests__/wallet.json",
      configTemplatePath: "src/commands/config/__tests__/initial-config.json",
    };
  });

  afterEach(() => {
    promptMock.mockRestore();
  });

  it("should create a config file with correct values for DNS-TXT and DNS-DID", async () => {
    promptMock.mockReturnValue({
      password: "password",
    });
    mockDeployDocumentStore.mockReturnValue({ contractAddress: "0xC378aBE13cf18a64fB2f913647bd4Fe054C9eaEd" });
    mockDeployTokenRegistry.mockReturnValue({ contractAddress: "0x620c1DC991E3E2585aFbaA61c762C0369D70C89D" });
    mockCreateTempDNS.mockReturnValue("alert-cyan-stoat.sandbox.openattestation.com");

    await createConfig(args);
    const configFileAsString = fs.readFileSync(`${folder.name}/config.json`, "utf-8");

    expect(JSON.parse(configFileAsString)).toStrictEqual(updatedConfig);
  });
});
