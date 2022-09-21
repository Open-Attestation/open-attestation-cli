import { ethers, Wallet } from "ethers";
import { DeployTokenRegistryCommand } from "../commands/deploy/deploy.types";
import { NetworkOption, WalletOrSignerOption } from "../commands/shared";
import {
  BaseTitleEscrowCommand,
  TitleEscrowChangeHolderCommand,
  TitleEscrowEndorseChangeOfOwnerCommand,
  TitleEscrowNominateBeneficiaryCommand,
} from "../commands/title-escrow/title-escrow-command.type";
import { TokenRegistryIssueCommand } from "../commands/token-registry/token-registry-command.type";
import { deployTokenRegistry } from "../implementations/deploy/token-registry";
import { surrenderDocument } from "../implementations/title-escrow/surrenderDocument";
import { issueToTokenRegistry } from "../implementations/token-registry/issue";
import { ConnectedSigner, getWalletOrSigner } from "../implementations/utils/wallet";
import { TransactionReceipt } from "@ethersproject/providers";
import { acceptSurrendered } from "../implementations/title-escrow/acceptSurrendered";
import { rejectSurrendered } from "../implementations/title-escrow/rejectSurrendered";
import { changeHolderOfTitleEscrow } from "../implementations/title-escrow/changeHolder";

import ganache from "ganache";
import { endorseChangeOfOwner } from "../implementations/title-escrow/changeOwner";
import { nominateBeneficiary } from "../implementations/title-escrow/nominateBeneficiary";
import { endorseNominatedBeneficiary } from "../implementations/title-escrow/endorseNominatedBeneficiary";

jest.mock("../implementations/utils/wallet", () => {
  const originalModule = jest.requireActual("../implementations/utils/wallet");
  return {
    __esModule: true,
    ...originalModule,
    getWalletOrSigner: jest.fn(),
  };
});

const accounts = {
  mnemonic: "indicate swing place chair flight used hammer soon photo region volume shuffle",
  owner: {
    ethAddress: "0xe0A71284EF59483795053266CB796B65E48B5124",
    publicKey: "0x02de2454a05cdb55780b85c04128233e31ac9179235607e4d6fa0c6b38140fb51a",
    privateKey: "0xe82294532bcfcd8e0763ee5cef194f36f00396be59b94fb418f5f8d83140d9a7",
  },
  receiver: {
    ethAddress: "0xcDFAcbb428DD30ddf6d99875dcad04CbEFcd6E60",
    publicKey: "0x0396762cb3d373ddab0685bbd5e45ccaf7481d8deb5b75ab38704fba089abed629",
    privateKey: "0xc58c1ff75001afdca8cecb61b47f36964febe4188b8f7b26252286ecae5a8879",
  },
};

const regexEthAddress = new RegExp("^0x[a-fA-F0-9]{40}$");

describe("token-registry", () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore mock static method
  const mockedGetWalletOrSigner: jest.Mock = getWalletOrSigner as jest.Mock;

  jest.setTimeout(90000);

  let tokenRegistryAddress = "";
  const defaultNetwork = "ropsten";

  const defaults = {
    network: defaultNetwork,
    gasPriceScale: 1,
    dryRun: false,
  };
  const ganacheOptions = {
    logging: {
      debug: false,
      quiet: true,
      verbose: false,
    },
    chain: {
      chainId: 3,
    },
    wallet: {
      mnemonic: accounts.mnemonic,
    },
    fork: {
      network: defaultNetwork,
    },
  };

  const ganacheProvider = ganache.provider(ganacheOptions);

  beforeAll(() => {
    mockedGetWalletOrSigner.mockImplementation(
      async ({}: WalletOrSignerOption & Partial<NetworkOption> & { progress?: (progress: number) => void }): Promise<
        Wallet | ConnectedSigner
      > => {
        const provider = new ethers.providers.Web3Provider(ganacheProvider);
        const wallet = await ethers.Wallet.fromMnemonic(accounts.mnemonic, "m/44'/60'/0'/0/0");
        const connectedWallet = wallet.connect(provider);
        return connectedWallet;
      }
    );
  });

  afterAll(async () => {
    await ganacheProvider.disconnect();
  });

  it("should be able to deploy token-registry", async () => {
    const tokenRegistryParameter: DeployTokenRegistryCommand = {
      registryName: "Test Token",
      registrySymbol: "TKN",
      ...defaults,
    };
    const tokenRegistryTransaction = await deployTokenRegistry(tokenRegistryParameter);
    // expect(tokenRegistryTransaction.confirmations).toBeGreaterThanOrEqual(1);
    // expect(tokenRegistryTransaction.status).toBe(1);
    const validTokenRegistryDeploy = regexEthAddress.test(tokenRegistryTransaction.contractAddress);
    expect(validTokenRegistryDeploy).toBe(true);
    tokenRegistryAddress = tokenRegistryTransaction.contractAddress;
  });

  const mintTransactionParameter = {
    to: accounts.owner.ethAddress,
    ...defaults,
  };

  const mintTransaction = async (
    retrievedTokenRegistryAddress: string,
    tokenId: string
  ): Promise<TransactionReceipt> => {
    const transactionParameter: TokenRegistryIssueCommand = {
      address: retrievedTokenRegistryAddress,
      tokenId: tokenId,
      beneficiary: accounts.owner.ethAddress,
      holder: accounts.owner.ethAddress,
      ...mintTransactionParameter,
    };
    const transaction = await issueToTokenRegistry(transactionParameter);
    return transaction;
  };

  it("should be able to mint title-escrow", async () => {
    const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
    const transaction = await mintTransaction(retrievedTokenRegistryAddress, tokenId);
    expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
    expect(transaction.status).toBe(1);
  });

  describe("title-escrow surrender", () => {
    const surrenderTransaction = async (
      retrievedTokenRegistryAddress: string,
      tokenId: string
    ): Promise<TransactionReceipt> => {
      const transactionParameter: BaseTitleEscrowCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        ...defaults,
      };
      const transaction = await surrenderDocument(transactionParameter);
      return transaction;
    };

    it("should be able to surrender title-escrow", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transaction = await surrenderTransaction(retrievedTokenRegistryAddress, tokenId);
      expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.status).toBe(1);
    });

    describe("title-escrow surrender response", () => {
      it("should be able to accept surrender title-escrow", async () => {
        const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000002";
        const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
        await mintTransaction(retrievedTokenRegistryAddress, tokenId);
        await surrenderTransaction(retrievedTokenRegistryAddress, tokenId);
        const transactionParameter: BaseTitleEscrowCommand = {
          tokenRegistry: retrievedTokenRegistryAddress,
          tokenId: tokenId,
          ...defaults,
        };
        const transaction = await acceptSurrendered(transactionParameter);
        expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
        expect(transaction.status).toBe(1);
      });

      it("should be able to reject surrender title-escrow", async () => {
        const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000003";
        const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
        await mintTransaction(retrievedTokenRegistryAddress, tokenId);
        await surrenderTransaction(retrievedTokenRegistryAddress, tokenId);
        const transactionParameter: BaseTitleEscrowCommand = {
          tokenRegistry: retrievedTokenRegistryAddress,
          tokenId: tokenId,
          ...defaults,
        };
        const transaction = await rejectSurrendered(transactionParameter);
        expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
        expect(transaction.status).toBe(1);
      });
    });
  });

  describe("title-escrow transfers", () => {
    const changeHolder = async (
      retrievedTokenRegistryAddress: string,
      tokenId: string
    ): Promise<TransactionReceipt> => {
      const transactionParameter: TitleEscrowChangeHolderCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        to: accounts.receiver.ethAddress,
        ...defaults,
      };
      const transaction = await changeHolderOfTitleEscrow(transactionParameter);
      return transaction;
    };

    const changeOwner = async (retrievedTokenRegistryAddress: string, tokenId: string): Promise<TransactionReceipt> => {
      const transactionParameter: TitleEscrowEndorseChangeOfOwnerCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        newHolder: accounts.receiver.ethAddress,
        newOwner: accounts.receiver.ethAddress,
        ...defaults,
      };
      const transaction = await endorseChangeOfOwner(transactionParameter);
      return transaction;
    };

    const nominateTitleEscrowBeneficiary = async (
      retrievedTokenRegistryAddress: string,
      tokenId: string
    ): Promise<TransactionReceipt> => {
      const transactionParameter: TitleEscrowNominateBeneficiaryCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        newOwner: accounts.receiver.ethAddress,
        ...defaults,
      };
      const transaction = await nominateBeneficiary(transactionParameter);
      return transaction;
    };

    it("should be able to change title escrow holder", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000004";
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transaction = await changeHolder(retrievedTokenRegistryAddress, tokenId);
      expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.status).toBe(1);
    });

    it("should be able to change title escrow owner", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000005";
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transaction = await changeOwner(retrievedTokenRegistryAddress, tokenId);
      expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.status).toBe(1);
    });

    it("should be able to nominate title escrow beneficiaries", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000006";
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transaction = await nominateTitleEscrowBeneficiary(retrievedTokenRegistryAddress, tokenId);

      expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.status).toBe(1);
    });

    it("should be able to complete transfer of title escrow beneficiaries", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000007";
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      await nominateTitleEscrowBeneficiary(retrievedTokenRegistryAddress, tokenId);
      const transactionParameter: TitleEscrowNominateBeneficiaryCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        newOwner: accounts.receiver.ethAddress,
        ...defaults,
      };
      const transaction = await endorseNominatedBeneficiary(transactionParameter);

      expect(transaction.nominatedBeneficiary).toBe(accounts.receiver.ethAddress);
      expect(transaction.transactionReceipt.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.transactionReceipt.status).toBe(1);
    });
  });

  const getTokenRegistryAddress = async (): Promise<string> => {
    if (tokenRegistryAddress === "") {
      const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
      await delay(3000);
      console.log("Delayed By 3s");
      return await getTokenRegistryAddress();
    } else {
      return tokenRegistryAddress;
    }
  };
});
