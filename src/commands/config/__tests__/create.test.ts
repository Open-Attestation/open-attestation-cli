import fs from "fs";
import { prompt } from "inquirer";
import tmp from "tmp";
import { deployDocumentStore } from "../../../implementations/deploy/document-store/document-store";
import { deployTokenRegistry } from "../../../implementations/deploy/token-registry/token-registry";
import { handler as createTempDNS } from "../../dns/txt-record/create";
import { CreateConfigCommand } from "../config.type";
import { handler as createConfig } from "../create";
import wallet from "./wallet.json";

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
      outputFile: "demo-config.json",
      storeName: "Demo Store Name",
      network: "ropsten",
      registryName: "Demo Token Registry",
      registrySymbol: "DTR",
      encryptedWalletPath: "./wallet.json",
      address: "0x709731d94d65b078496937655582401157c8a640",
      networkId: 3,
      sandboxEndpoint: "https://sandbox.openattestation.com",
      gasPriceScale: 1,
      dryRun: false,
    };
  });

  afterEach(() => {
    promptMock.mockRestore();
  });

  it("should create a config file with correct values", async () => {
    promptMock.mockReturnValue({ password: "password" });
    mockDeployDocumentStore.mockReturnValue({ contractAddress: "0xce604d09941a7601dA58a3A63C0AE025fEd60770" });
    mockDeployTokenRegistry.mockReturnValue({ contractAddress: "0x46503426b0F2825dbccB2932Fb5d42bF64E255B5" });
    mockCreateTempDNS.mockReturnValue("DNS");

    await createConfig(args);
    const configFileAsString = fs.readFileSync(`${folder.name}/demo-config.json`, "utf-8");

    expect(JSON.parse(configFileAsString)).toStrictEqual({
      network: "ropsten",
      wallet: JSON.stringify(wallet),
      forms: [
        {
          name: "Covering Letter",
          type: "VERIFIABLE_DOCUMENT",
          defaults: {
            $template: {
              type: "EMBEDDED_RENDERER",
              name: "COVERING_LETTER",
              url: "https://generic-templates.tradetrust.io",
            },
            issuers: [
              {
                name: "Demo Issuer",
                documentStore: "0xce604d09941a7601dA58a3A63C0AE025fEd60770",
                identityProof: {
                  type: "DNS-TXT",
                  location: "DNS",
                },
              },
            ],
            name: "Covering Letter",
            logo: "<Logo URL>",
            backgroundColor: "<Background color>",
            titleColor: "<Title text color>",
            descriptionColor: "<Remarks text color>",
            title: "<Default title for the document>",
            remarks: "<Default remarks for the document>",
            uiSchema: {
              remarks: {
                "ui:widget": "textarea",
              },
            },
          },
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                title: "Document Title",
              },
              remarks: {
                type: "string",
                title: "Remarks",
              },
            },
          },
          attachments: {
            allow: true,
          },
        },
        {
          name: "Bill of Lading",
          type: "TRANSFERABLE_RECORD",
          defaults: {
            $template: {
              type: "EMBEDDED_RENDERER",
              name: "BILL_OF_LADING_GENERIC",
              url: "https://generic-templates.tradetrust.io",
            },
            issuers: [
              {
                identityProof: {
                  type: "DNS-TXT",
                  location: "DNS",
                },
                name: "DEMO TOKEN REGISTRY",
                tokenRegistry: "0x46503426b0F2825dbccB2932Fb5d42bF64E255B5",
              },
            ],
            blNumber: "<BL Number>",
            companyName: "<Company Name>",
            field1: "<Field1 text>",
            field2: "<Field2 text>",
            field3: "<Field3 text>",
            field4: "<Field4 text>",
            field5: "<Field5 text>",
            field6: "<Field6 text>",
            field7: "<Field7 text>",
            field8: "<Field8 text>",
            field9: "<Field9 text>",
            uiSchema: {
              logo: {
                "ui:widget": "file",
              },
            },
          },
          schema: {
            type: "object",
            required: ["blNumber"],
            properties: {
              blNumber: {
                type: "string",
                title: "BL Number",
              },
              logo: {
                title: "Logo",
                type: "string",
              },
              companyName: {
                title: "Company Name",
                type: "string",
              },
              field1: {
                title: "Field1",
                type: "string",
              },
              field2: {
                title: "Field2",
                type: "string",
              },
              field3: {
                title: "Field3",
                type: "string",
              },
              field4: {
                title: "Field4",
                type: "string",
              },
              field5: {
                title: "Field5",
                type: "string",
              },
              field6: {
                title: "Field6",
                type: "string",
              },
              field7: {
                title: "Field7",
                type: "string",
              },
              field8: {
                title: "Field8",
                type: "string",
              },
              field9: {
                title: "Field9",
                type: "string",
              },
            },
          },
          attachments: {
            allow: true,
          },
        },
      ],
    });
  });
});
