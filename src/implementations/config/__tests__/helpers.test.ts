import { getConfigFile, getConfigWithUpdatedForms } from "../helpers";
import ConfigFileV3 from "./config-reference-v3.json";
import expectedConfigFileOutputV3 from "./expected-config-file-output-v3.json";
import expectedConfigFileOutputV2 from "./expected-config-file-output-v2.json";
import ConfigFileV2 from "./input-config-file.json";
import wallet from "./wallet.json";

describe("getConfigFile", () => {
  it("should return the config file when given a configTemplateUrl", async () => {
    const config = await getConfigFile(
      "",
      "https://raw.githubusercontent.com/TradeTrust/tradetrust-config/master/build/reference/config-v3.json"
    );

    expect(config).toStrictEqual(ConfigFileV3);
  });

  it("should throw an error when no configTemplatePath or configTemplateUrl is provided", async () => {
    await expect(getConfigFile("", "")).rejects.toHaveProperty("message", "Config template reference not provided.");
  });
});
wallet;
describe("getConfigWithUpdatedForms", () => {
  it("should update form correctly for V2 forms", () => {
    const config = getConfigWithUpdatedForms({
      configFile: {
        ...ConfigFileV2,
        wallet: {
          ...ConfigFileV2.wallet,
          encryptedJson: JSON.stringify(wallet),
        },
      } as any,
      chain: {
        id: "5",
        currency: "ETH",
      },
      documentStoreAddress: "0xC378aBE13cf18a64fB2f913647bd4Fe054C9eaEd",
      tokenRegistryAddress: "0x620c1DC991E3E2585aFbaA61c762C0369D70C89D",
      dnsVerifiable: "alert-cyan-stoat.sandbox.openattestation.com",
      dnsDid: "alert-cyan-stoat.sandbox.openattestation.com",
      dnsTransferableRecord: "alert-cyan-stoat.sandbox.openattestation.com",
    });
    expect(config).toStrictEqual(expectedConfigFileOutputV2);
  });

  it("should update form correctly for V3 forms", () => {
    const config = getConfigWithUpdatedForms({
      configFile: {
        ...ConfigFileV3,
        wallet: {
          ...ConfigFileV3.wallet,
          encryptedJson: JSON.stringify(wallet),
        },
      } as any,
      chain: {
        id: "5",
        currency: "ETH",
      },
      documentStoreAddress: "0xC378aBE13cf18a64fB2f913647bd4Fe054C9eaEd",
      tokenRegistryAddress: "0x620c1DC991E3E2585aFbaA61c762C0369D70C89D",
      dnsVerifiable: "alert-cyan-stoat.sandbox.openattestation.com",
      dnsDid: "alert-cyan-stoat.sandbox.openattestation.com",
      dnsTransferableRecord: "alert-cyan-stoat.sandbox.openattestation.com",
    });
    expect(config).toStrictEqual(expectedConfigFileOutputV3);
  });
});
