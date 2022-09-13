import { ethers, Wallet } from "ethers";
import { DeployTokenRegistryCommand } from "../commands/deploy/deploy.types";
import { NetworkOption, WalletOrSignerOption } from "../commands/shared";
import {
  BaseTitleEscrowCommand,
  TitleEscrowChangeHolderCommand,
  TitleEscrowEndorseChangeOfOwnerCommand,
  TitleEscrowNominateChangeOfOwnerCommand,
} from "../commands/title-escrow/title-escrow-command.type";
import { TokenRegistryIssueCommand } from "../commands/token-registry/token-registry-command.type";
import { deployTokenRegistry } from "../implementations/deploy/token-registry";
import { surrenderDocument } from "../implementations/title-escrow/surrenderDocument";
import { issueToTokenRegistry } from "../implementations/token-registry/issue";
import { progress as defaultProgress } from "../implementations/utils/progress";
import { ConnectedSigner, getWalletOrSigner } from "../implementations/utils/wallet";
import { TransactionReceipt } from "@ethersproject/providers";
import { acceptSurrendered } from "../implementations/title-escrow/acceptSurrendered";
import { rejectSurrendered } from "../implementations/title-escrow/rejectSurrendered";
import { changeHolderOfTitleEscrow } from "../implementations/title-escrow/changeHolder";
import { nominateChangeOfOwner } from "../implementations/title-escrow/nominateChangeOfOwner";
import { endorseTransferOfOwner } from "../implementations/title-escrow/endorseTransferOfOwner";
import { endorseChangeOfOwner } from "../implementations/title-escrow/endorseChangeOfOwner";

import ganache from "ganache";

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

const ganacheOptions = {
  mnemonic: accounts.mnemonic,
};
const regexEthAddress = new RegExp("^0x[a-fA-F0-9]{40}$");

describe("token-registry", () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore mock static method
  const mockedGetWalletOrSigner: jest.Mock = getWalletOrSigner as jest.Mock;

  let tokenRegistryAddress = "";
  const defaults = {
    network: "mainnet",
    gasPriceScale: 1,
    dryRun: false,
  };

  beforeAll(() => {
    const provider = new ethers.providers.Web3Provider(ganache.provider(ganacheOptions));
    mockedGetWalletOrSigner.mockImplementation(
      async ({
        network,
        progress = defaultProgress("Decrypting Wallet"),
        ...options
      }: WalletOrSignerOption & Partial<NetworkOption> & { progress?: (progress: number) => void }): Promise<
        Wallet | ConnectedSigner
      > => {
        const wallet = await ethers.Wallet.fromMnemonic(accounts.mnemonic, "m/44'/60'/0'/0/0");
        const connectedWallet = wallet.connect(provider);
        return connectedWallet;
      }
    );
  });

  it("should be able to deploy token-registry", async () => {
    const tokenRegistryParameter: DeployTokenRegistryCommand = {
      registryName: "Test Token",
      registrySymbol: "TKN",
      ...defaults,
    };
    const tokenRegistryTransaction = await deployTokenRegistry(tokenRegistryParameter);
    expect(tokenRegistryTransaction.confirmations).toBeGreaterThanOrEqual(1);
    expect(tokenRegistryTransaction.status).toBe(1);
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

  describe("title-escrow transfer", () => {
    it("should be able to change holder of title-escrow", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000004";
      const destinationWalletAddress = accounts.receiver.ethAddress;
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transactionParameter: TitleEscrowChangeHolderCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        to: destinationWalletAddress,
        ...defaults,
      };
      const transaction = await changeHolderOfTitleEscrow(transactionParameter);
      expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.status).toBe(1);
    });

    it("should be able to nominate change of holder of title-escrow", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000005";
      const destinationWalletAddress = accounts.receiver.ethAddress;
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transactionParameter: TitleEscrowNominateChangeOfOwnerCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        newOwner: destinationWalletAddress,
        ...defaults,
      };
      const transaction = await nominateChangeOfOwner(transactionParameter);
      expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.status).toBe(1);
    });

    it("should be able to endorse transfer of owner of title-escrow", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000006";
      const destinationWalletAddress = accounts.receiver.ethAddress;
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transactionParameter: BaseTitleEscrowCommand = {
        tokenRegistry: retrievedTokenRegistryAddress,
        tokenId: tokenId,
        ...defaults,
      };
      const transaction = await endorseTransferOfOwner(transactionParameter);
      expect(transaction.transactionReceipt.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.transactionReceipt.status).toBe(1);
      // TODO expect approvedOwner/approvedHolder
    });

    it("should be able to endorse change of owner of title-escrow", async () => {
      const tokenId = "0x0000000000000000000000000000000000000000000000000000000000000007";
      const destinationWalletAddress = accounts.receiver.ethAddress;
      const retrievedTokenRegistryAddress = await getTokenRegistryAddress();
      await mintTransaction(retrievedTokenRegistryAddress, tokenId);
      const transactionParameter: TitleEscrowEndorseChangeOfOwnerCommand = {
        tokenId: tokenId,
        tokenRegistry: retrievedTokenRegistryAddress,
        newHolder: destinationWalletAddress,
        newOwner: destinationWalletAddress,
        ...defaults,
      };
      const transaction = await endorseChangeOfOwner(transactionParameter);
      expect(transaction.confirmations).toBeGreaterThanOrEqual(1);
      expect(transaction.status).toBe(1);
    });
  });

  const getTokenRegistryAddress = async (): Promise<string> => {
    if (tokenRegistryAddress === "") {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      await delay(3000);
      return await getTokenRegistryAddress();
    } else {
      return tokenRegistryAddress;
    }
  };
});
