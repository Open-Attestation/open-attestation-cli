import { NetworkCmdName } from "../../../common/networks";
import {
  getConfigFile,
  getConfigWithUpdatedForms,
  getConfigWithUpdatedNetwork,
  getConfigWithUpdatedWallet,
} from "../helpers";
import { ConfigFile } from "../types";
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

describe("getConfigWithUpdatedNetwork", () => {
  it("should update config file with network for V2", () => {
    expect(
      getConfigWithUpdatedNetwork({ configFile: ConfigFileV2 as ConfigFile, network: NetworkCmdName.Sepolia }).network
    ).toStrictEqual(NetworkCmdName.Sepolia);
  });
  it("should update config file with network for V3", () => {
    expect(
      getConfigWithUpdatedNetwork({ configFile: ConfigFileV3 as ConfigFile, network: NetworkCmdName.Sepolia }).network
    ).toStrictEqual(NetworkCmdName.Sepolia);
  });
});

describe("getConfigWithUpdatedWallet", () => {
  it("should update config file with wallet string for V2", () => {
    expect(
      getConfigWithUpdatedWallet({ configFile: ConfigFileV2 as ConfigFile, walletStr: JSON.stringify(wallet) }).wallet
        .encryptedJson
    ).toStrictEqual(JSON.stringify(wallet));
  });
  it("should update config file with wallet string for V3", () => {
    expect(
      getConfigWithUpdatedWallet({ configFile: ConfigFileV3 as ConfigFile, walletStr: JSON.stringify(wallet) }).wallet
        .encryptedJson
    ).toStrictEqual(JSON.stringify(wallet));
  });
});

describe("getConfigWithUpdatedForms", () => {
  it("should update form correctly for V2 forms", () => {
    const configWithWallet = getConfigWithUpdatedWallet({
      configFile: ConfigFileV2 as ConfigFile,
      walletStr: JSON.stringify(wallet),
    });
    const config = getConfigWithUpdatedForms({
      configFile: configWithWallet as ConfigFile,
      chain: {
        id: "11155111",
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
    const configWithWallet = getConfigWithUpdatedWallet({
      configFile: ConfigFileV3 as ConfigFile,
      walletStr: JSON.stringify(wallet),
    });
    const config = getConfigWithUpdatedForms({
      configFile: configWithWallet as ConfigFile,
      chain: {
        id: "11155111",
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
