# Open Attestation (CLI)

This CLI tool in the [Open Attestation CLI](https://github.com/Open-Attestation/open-attestation-cli) repository turns .json documents into any open-attestation verifiable documents. It applies the OpenAttestation algorithm to produce a hash of the json document and then creates a file with the data and proof of integrity.

## Installation

### Binary

To install the binary, simply download the binary from the [CLI release page](https://github.com/Open-Attestation/open-attestation-cli/releases) for your OS.

> We are aware that the size of the binaries must be reduced and we have tracked the issue in [Github](https://github.com/Open-Attestation/open-attestation-cli/issues/68). We hope to find a solution in a near future and any help is welcomed.

### NPM

Alternatively for Linux or MacOS users, if you have `npm` installed on your machine, you may install the cli using the following command:

```bash
npm install -g @govtechsg/open-attestation-cli
```

The above command will install the open-attestation CLI to your machine. You will need to have node.js installed to be able to run the command.

You can also opt to use npx:

```bash
npx -p @govtechsg/open-attestation-cli open-attestation <arguments>
```

> In all the guides, we will refer to the CLI as `open-attestation` when running a command. That means we will assume the CLI is available in your execution path. If it's not the case, you will to change `open-attestation` by the full path to the executable.

---

## Supported networks

| Network | Chain ID | Type       |
| ------- | -------- | ---------- |
| mainnet | 1        | Production |
| ropsten | 3        | Test       |
| rinkeby | 4        | Test       |
| goerli  | 5        | Test       |
| polygon | 137      | Production |
| mumbai  | 80001    | Test       |

---

## Usage

#### List of features with the required options

|                                            | Private Key | Wallet | Aws Kms |
| ------------------------------------------ | ----------- | ------ | ------- |
| Create config                              | ❎          | ✔️     | ❎      |
| Deploy document store                      | ✔           | ✔      | ✔       |
| Deploy token registry                      | ✔           | ✔      | ✔       |
| Dns txt create                             | ❎          | ❎     | ❎      |
| Dns txt get                                | ❎          | ❎     | ❎      |
| Document store issue                       | ✔           | ✔      | ✔       |
| Document store revoke                      | ✔           | ✔      | ✔       |
| Document store transfer ownership          | ✔           | ✔      | ✔       |
| Token registry issue                       | ✔           | ✔      | ✔       |
| Token registry mint                        | ✔           | ✔      | ✔       |
| Transaction cancel                         | ✔           | ✔      | ✔       |
| Wallet create                              | ❎          | ❎     | ❎      |
| Wallet decrypt                             | ❎          | ❎     | ❎      |
| Wallet encrypt                             | ✔           | ❎     | ❎      |
| Filter (obfuscate) document                | ❎          | ❎     | ❎      |
| Sign document                              | ✔           | ❎     | ❎      |
| Encrypt document                           | ❎          | ❎     | ❎      |
| Decrypt document                           | ❎          | ❎     | ❎      |
| Wrap document                              | ❎          | ❎     | ❎      |
| Unwrap document                            | ❎          | ❎     | ❎      |
| Verify document                            | ❎          | ❎     | ❎      |
| Change holder (Title Escrow)               | ✔           | ✔      | ✔       |
| Nominate change of owner (Title Escrow)    | ✔           | ✔      | ✔       |
| Endorse transfer to owner (Title Escrow)   | ✔           | ✔      | ✔       |
| Endorse change of owner (Title Escrow)     | ✔           | ✔      | ✔       |
| Surrender document (Title Escrow)          | ✔           | ✔      | ✔       |
| Reject surrendered document (Title Escrow) | ✔           | ✔      | ✔       |
| Accept surrendered document (Title Escrow) | ✔           | ✔      | ✔       |

### Wrapping documents

This command process all documents in the input directory. It will add the issuance proofs to the individual documents. Additionally, you'll get the Batch Document Root (merkleRoot) value. Thereafter, you can issue all the documents in a single batch with the merkleRoot later.

Example:

```bash
open-attestation wrap ./examples/raw-documents/example.0.json

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

The command will display the result in the console. If you need to save the file you can use the `--output-file` file.

Example:

```bash
open-attestation wrap ./examples/raw-documents/example.0.json --output-file ./examples/wrapped-documents/example.0.json

✔  success   Batch Document Root: 0x5d318c8083aac18f8075ca2a2eac74b06f2cc37d6ccad680c7c80c9bb36f7be1
```

If you need to wrap a folder you will need to provide the `--output-dir` options to specify in which folder the documents must be wrapped in.

Example:

```bash
open-attestation wrap ./examples/raw-documents --output-dir ./examples/wrapped-documents

✔  success   Batch Document Root: 0x5d318c8083aac18f8075ca2a2eac74b06f2cc37d6ccad680c7c80c9bb36f7be1
```

You can also provide an optional JSON schema document to perform extra check on the documents

Example:

```bash
open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ --schema ./examples/schema.json

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc

open-attestation wrap ./examples/raw-documents/ ./examples/wrapped-documents/ -s ./examples/schema.json

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

The JSON schema parameter also allow for http endpoint returning valid JSON schema:

Example:

```bash
open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ --schema https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc

open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ -s https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

You can also re-wrap a document by editing a wrapped document content and using the `--unwrap` option:

```bash
open-attestation wrap ./examples/raw-documents/example.0.json --output-file ./examples/wrapped-documents/example.0.json

# edit the recipient name in ./tmp/wrapped-documents/example.0.json for instance for Your Name to Another Name
open-attestation wrap ./examples/wrapped-documents/example.0.json --of ./examples/wrapped-documents/example.1.json --unwrap
```

You can disable the `--batched` option to wrap multiple documents individually (i.e. they will not have the same merkle root):

```bash
open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ --batched false
✔  success   All documents have been individually wrapped
```

By default the CLI will use open-attestation schema v2 but you can opt in for open-attestation schema v3 using `open-attestation-v3` option:

```bash
open-attestation wrap ./examples/raw-documents/ ./examples/wrapped-documents/ --open-attestation-v3
open-attestation wrap ./examples/raw-documents/ ./examples/wrapped-documents/ --oav3
```

> **_NOTE:_** For transferable records, you should wrap them individually as each of them would be minted to a unique title escrow that represents the beneficiary and holder entities of the document. For more information about title escrow, refer [here](https://www.openattestation.com/docs/integrator-section/transferable-record/title-escrow).

### Unwrapping documents

This command processes a document in the input directory. It will unwrap the wrapped document to its raw document form to be displayed on the console.

Example:

```bash
open-attestation unwrap ./examples/v2/wrapped-documents/example.0.json

✔  success   The document has been unwrapped
```

The command will display the result in the console. If you need to save the file you can use the `--output-file` option.

Example:

```bash
open-attestation unwrap ./examples/v2/wrapped-documents/example.0.json --output-file ./examples/v2/raw-documents/example.0.json

✔  success   The document has been unwrapped
```

If you need to unwrap a folder you will need to provide the `--output-dir` option to specify which folder the documents must be unwrapped in.

Example:

```bash
open-attestation unwrap ./examples/v2/wrapped-documents --output-dir ./examples/v2/raw-documents

✔  success   The documents have been individually unwrapped into folder ./examples/v2/raw-documents
```

### Document privacy filter

This allows document holders to generate valid documents which obfuscates certain fields. For example, sensitive information that you wish not to disclose.

```bash
open-attestation filter <inputDocumentPath> <outputDocumentPath> [filters...]
```

Example:

```bash
open-attestation filter examples/wrapped-documents/example.0.json tmp/example.0.out.json key1

✔  success  Obfuscated document saved to: tmp/example.0.out.json
```

### Encrypting document

This allows you to encrypt document in order to share and store them safely.

```bash
open-attestation encrypt <inputDocumentPath> <outputEncryptedPath>
```

Example:

```bash
open-attestation encrypt ./examples/wrapped-documents/example.0.json ./tmp/encrypted.json

✔  success   Encrypted document saved to: tmp/encrypted.json
⚠  warning   Here is the key to decrypt the document: don't lose it: 9bac5be27bac31d852fc1e48eb9d5249ec6ad7978da23377b5879f7a24994cb2
```

### Decrypting document

This allows you to decrypt document encrypted using the method above.

```bash
open-attestation decrypt <input> <output> <key>
```

Example:

```bash
open-attestation decrypt ./src/__tests__/fixture/did-dns-encrypted.json decrypted.json 88da9b9cd61cfc1677ae7e79dba9b3aeba4b40c95f94c950759e76c6210b5402

✔  success   Decrypted document saved to: decrypted.json
```

### Token Registry

#### Deploy new Token Registry

Deploys a token registry contract on the blockchain. Factory Contract that have been deployed using token-registry can be used with the factory address flag. To deploy a standalone token registry, please refer to [Token-Registry](https://github.com/Open-Attestation/token-registry) deployment.

```bash
open-attestation deploy token-registry <registry-name> <registry-symbol> --factory-address <factory-address> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation deploy token-registry "My Sample Token" MST --network ropsten

✔  success   Token registry deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

#### Issue document to token registry

`Issue` a hash to a token registry deployed on the blockchain. The `tokenId` option would be used to indicate the document hash, and the `to` option to indicate the title escrow address the document is mapped to.

```bash
open-attestation token-registry issue --network <NETWORK> --address <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --beneficiary <BENEFICIARY> --holder <HOLDER> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation token-registry mint --network ropsten --address 0x6133f580aE903b8e79845340375cCfd78a45FF35 --tokenId 0x10ee711d151bc2139473a57531f91d961b639affb876b350c31d031059cdcc2c --to 0xB26B4941941C51a4885E5B7D3A1B861E54405f90


✔  success   Token with hash 0x10ee711d151bc2139473a57531f91d961b639affb876b350c31d031059cdcc2c has been issued on 0x6133f580aE903b8e79845340375cCfd78a45FF35 with the initial recipient being 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

`mint` can be used instead of issue and will be strictly equivalent.

#### Token Registry Roles

Interfaces for the Assignment and Revocation of roles are available on the Token Registry repository.


### Document Store

#### Deploy new document store

Deploys a document store contract on the blockchain

```bash
open-attestation deploy document-store <store-name> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation deploy document-store "My Name" --network ropsten

✔  success   Document store deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

#### Issue document to document store

Issue a hash to a document store deployed on the blockchain

```bash
open-attestation document-store issue --address <DOCUMENT_STORE_ADDRESS> --hash <HASH> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation document-store issue --network ropsten --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 0x43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1

✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been issued on 0x19f89607b52268D0A19543e48F790c65750869c6
```

#### Revoke document in document store

Revoke a hash to a document store deployed on the blockchain

```bash
open-attestation document-store revoke --address <DOCUMENT_STORE_ADDRESS> --hash <HASH> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation document-store revoke --network ropsten --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 0x43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1

✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been revoked on 0x19f89607b52268D0A19543e48F790c65750869c6
```

#### Transfer ownership of document store

Transfer ownership of a document store deployed on the blockchain to another wallet

```bash
open-attestation document-store transfer-ownership --address <DOCUMENT_STORE_ADDRESS> --new-owner <HASH> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation document-store transfer-ownership --address 0x80732bF5CA47A85e599f3ac9572F602c249C8A28 --new-owner 0xf81ea9d2c0133de728d28b8d7f186bed61079997 --network ropsten

✔  success   Ownership of document store 0x80732bF5CA47A85e599f3ac9572F602c249C8A28 has been transferred to new wallet 0xf81ea9d2c0133de728d28b8d7f186bed61079997
```

### Verify

Verify if a document is valid.

```bash
open-attestation verify --document ./examples/wrapped-documents/example.0.json --network ropsten

…  awaiting  Verifying examples/wrapped-documents/example.0.json
✔  success   The document is valid
```

### DID Direct Signing

Sign on an OA document directly with a private key.

```bash
open-attestation sign ./examples/unsigned-documents -f ./examples/sample-key -p did:ethr:0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69#controller --output-dir ./examples/signed-documents
```

### DNS TXT Record

Create a temporary DNS TXT record in OpenAttestation sandbox

```bash
open-attestation dns txt-record create --address 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc --networkId 10
✔  success   Record created at exotic-blush-primate.sandbox.openattestation.com and will stay valid until Thu Jul 02 2020 13:51:34 GMT+0800 (Singapore Standard Time)
```

Get the list of DNS TXT records associated to a domain

```bash
open-attestation dns txt-record get --location resulting-magenta-locust.sandbox.openattestation.com
┌─────────┬────────────┬────────────┬───────┬──────────┬────────┐
│ (index) │    type    │    net     │ netId │   addr   │ dnssec │
├─────────┼────────────┼────────────┼───────┼──────────┼────────┤
│    0    │ 'openatts' │ 'ethereum' │ '10'  │ '0xabcd' │ false  │
└─────────┴────────────┴────────────┴───────┴──────────┴────────┘
```

Filter the list of DNS TXT records associated to a domain on a specific network

```bash
open-attestation dns txt-record get --location example.openattestation.com --networkId 3
┌─────────┬────────────┬────────────┬───────┬──────────────────────────────────────────────┬────────┐
│ (index) │    type    │    net     │ netId │                     addr                     │ dnssec │
├─────────┼────────────┼────────────┼───────┼──────────────────────────────────────────────┼────────┤
│    0    │ 'openatts' │ 'ethereum' │  '3'  │ '0x2f60375e8144e16Adf1979936301D8341D58C36C' │ false  │
│    1    │ 'openatts' │ 'ethereum' │  '3'  │ '0x532C9Ff853CA54370D7492cD84040F9f8099f11B' │ false  │
│    2    │ 'openatts' │ 'ethereum' │  '3'  │ '0x53f3a47C129Ea30D80bC727556b015F02bE63811' │ false  │
│    3    │ 'openatts' │ 'ethereum' │  '3'  │ '0x8Fc57204c35fb9317D91285eF52D6b892EC08cD3' │ false  │
│    4    │ 'openatts' │ 'ethereum' │  '3'  │ '0xdcA6Eea7024151c270b50FcA9E67161119B06BAD' │ false  │
└─────────┴────────────┴────────────┴───────┴──────────────────────────────────────────────┴────────┘
```

### Wallet

Creating a wallet

```bash
open-attestation wallet create --of ./tmp

ℹ  info      Creating a new wallet
? Wallet password [hidden]
…  awaiting  Encrypting Wallet [====================] [100/100%]
ℹ  info      Wallet with public address 0x6348a96D96D56665C2E9619f81355918779f3d9E successfully created. Find more details:
✔  success   Wallet successfully saved into /path/to/tmp
```

Encrypting a wallet (see [below](#providing-the-wallet) to find out how to provide the key)

```bash
open-attestation wallet encrypt --of ./tmp

ℹ  info      Encrypting a wallet
? Wallet password [hidden]
…  awaiting  Encrypting Wallet [====================] [100/100%]
ℹ  info      Wallet with public address 0xB26B4941941C51a4885E5B7D3A1B861E54405f90 successfully created. Find more details:
✔  success   Wallet successfully saved into /path/to/tmp

```

Decrypt a wallet to get information about it. Some information might be sensitive

```bash
open-attestation wallet decrypt wallet.json
⚠  warning   You are about to reveal the private key of your wallet. Please type the following word into the terminal to prove that you understand the risks: active-aqua-swordtail
? ack: active-aqua-swordtail
ℹ  info      User consented to risks
? Wallet password [hidden]
…  awaiting  Decrypting Wallet [====================] [100/100%]
ℹ  info      Wallet successfully decrypted
✔  success   Wallet information:
- address: 0x19bf1b00f78f521999d9A4246818F362fcaA1A96
- public key: 0x04e1a6facd0fee89e44ae51c1352e32224e79caaa3ccf5afa9d77f10f92f7c4c584ccdf6cfb9a71584c18408a1a0e12341556757268117afebda00d6d6e71133bf
- private key ....
```

### Providing the wallet

When interacting with blockchain you will likely need to provide a way to access your wallet. All functions - when the wallet is required - will provide multiples ways for you to pass it in:

1. Using `encrypted-wallet-path` option where you provide a path to an [encrypted wallet](https://docs.ethers.io/v5/api/signer/#Wallet-encrypt) (recommended).
1. Using `OA_PRIVATE_KEY` environment variable holding the private key.
1. Using `--key-file` option where you provide a path to a file containing the private key.
1. Using `--key` option where you provide the private key directly to the command (**Note that in this case, the private key may be stored in the machine's bash history**).

Example:

```bash
# Using encrypted-wallet-path option
open-attestation deploy document-store "My Name" --network ropsten --encrypted-wallet-path /path/to/wallet.json
# Then you will be prompted to type your password to decrypt the wallet
? Wallet password [input is hidden]

# Using environment variable
export OA_PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000001
open-attestation deploy document-store "My Name" --network ropsten
unset OA_PRIVATE_KEY

# Using private key stored in file
echo -n 0000000000000000000000000000000000000000000000000000000000000002 >> ./examples/sample-key
open-attestation deploy document-store "My Name" --network ropsten --key-file ./examples/sample-key
rm ./examples/sample-key

# Providing the key to the command
open-attestation deploy document-store "My Name" --network ropsten --key 0000000000000000000000000000000000000000000000000000000000000003
```

### Config (Create configuration file)

This command will generate a config file with sandbox DNS, document store and token registry.

> Please note that a wallet.json file in ropsten network with sufficient **funds** must be provided in order for this command to work.

You will need:

- `--output-dir` option specify which folder the config file will be created in.
- `--encrypted-wallet-path` option indicates a path to an [encrypted wallet](https://docs.ethers.io/v5/api/signer/#Wallet-encrypt).
- `--config-template-url` option to provide a path to reference a config template file hosted on a public url.
- `--config-template-path` option to provide a path to reference a config template file locally.

There are 2 ways of using this command to generate a config file, both in which, will return a new config file with sandbox DNS, updated document store and updated token registry.

#### Method 1: Using config-template-url option (recommended)

This method will generate the most basic config file with a sandbox DNS, document store and token registry. The reference config templates are [here](https://github.com/TradeTrust/document-creator-website/tree/master/src/test/fixtures/config/_generated-config-files/v2).

Step 1: Generate a wallet.json file

```
// If you already have a wallet.json that is in ropsten network with sufficient funds, you can skip this step.
open-attestation wallet create --output-file wallet.json --fund ropsten
```

Step 2: Generate config file by passing in the generated wallet.json file

```
open-attestation config create --output-dir ./example-configs --encrypted-wallet-path </path/to>/wallet.json --config-template-url <remote url>
```

#### Method 2: Using config-template-path option

This method will generate a copy of your existing config file with the updated sandbox DNS, document store and token registry.

Step 1: Generate a wallet.json file

```
// If you already have a wallet.json that is in ropsten network with sufficient funds, you can skip this step.
open-attestation wallet create --output-file wallet.json --fund ropsten
```

Step 2: Generate config file by passing in the generated wallet.json file and a existing config file

```
open-attestation config create --output-dir ./example-configs --encrypted-wallet-path </path/to>/wallet.json --config-template-path </path/to>/config.json
```

### Cancel pending transaction

This command will cancel pending transaction.

Please note that a this action is irreversible.

You will need:

- `--nonce` option specify which transaction to cancel.
- `--gas-price` option, the gas price is required to be higher than the pending transaction.
- `--transaction-hash` transaction hash option can be used as an alternative to nonce and gas-price option. Using this option will automatically increase the transaction gas price by 100%.
- options to provide the wallet (https://github.com/Open-Attestation/open-attestation-cli#providing-the-wallet)

```
open-attestation transaction cancel --nonce <pending transaction nonce> --gas-price <gas price> [option]
```

Examples:

```
open-attestation transaction cancel --nonce 1 --gas-price 300 --network ropsten --encrypted-wallet-path /path/to/wallet
```

```
open-attestation transaction cancel --transaction-hash 0x000 --network ropsten --encrypted-wallet-path /path/to/wallet
```

### Title Escrow

#### Change Holder

This command will allow the owner of a transferable record to change its holder.

```bash
open-attestation title-escrow change-holder --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newHolder <NEW_HOLDER> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation title-escrow change-holder --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --newHolder 0xB26B4941941C51a4885E5B7D3A1B861E54405f90

✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully changed to holder with address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Nominate Change of Owner

This command will allow the owner of the transferable record to nominate a new owner of the transferable record.
**This command will fail if you are not the owner of the transferable record.**

```bash
open-attestation title-escrow nominate-change-owner --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newOwner <NEW_OWNER_ADDRESS> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation title-escrow nominate-change-owner --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --newOwner 0xB26B4941941C51a4885E5B7D3A1B861E54405f90

✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully nominated to new owner with address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Endorse Transfer of Owner

This command will allow the holder of the transferable record to endorse the transfer to an approved owner and approved holder of the transferable record.
**This command will fail if there is no approved owner or holder record on the transferable record.**

```bash
open-attestation title-escrow endorse-transfer-owner --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newOwner <NEW_OWNER> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation title-escrow endorse-transfer-owner --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990

✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully endorsed to approved owner at 0x2f60375e8144e16Adf1979936301D8341D58C36C and approved holder at 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Endorse Change of Owner

This command will allow the owner of the transferable record to endorse the change of owner to a new owner and new holder of the transferable record.
**This command will fail if the provided holder and owner's addresses are the same as the current owner and current holder's addresses.**

```bash
open-attestation title-escrow endorse-change-owner --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newOwner <NEW_OWNER_ADDRESS> --newHolder <NEW_HOLDER_ADDRESS> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation title-escrow endorse-change-owner --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --newOwner 0xB26B4941941C51a4885E5B7D3A1B861E54405f90 --newHolder 0x2f60375e8144e16Adf1979936301D8341D58C36C

✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully endorsed to new owner with address 0x2f60375e8144e16Adf1979936301D8341D58C36C and new holder with address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Surrender Document

This command will allow the entity (who is both an owner and holder) to surrender it's transferable record to the token registry.

```bash
open-attestation title-escrow surrender --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation title-escrow reject-surrendered --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --network ropsten

✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 has been surrendered.
```

#### Reject Surrendered Document

This command will allow the token registry to reject a surrendered transferable record.

```bash
open-attestation title-escrow reject-surrendered --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation title-escrow reject-surrendered --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --network ropsten

✔  success   Surrendered transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 has been rejected.
```

#### Accept Surrendered Document

This command will allow the token registry to accept a surrendered transferable record.

```bash
open-attestation title-escrow accept-surrendered --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation title-escrow accept-surrendered --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --network ropsten

✔  success   Surrendered transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 has been accepted.
```

## Help

Run the command with `--help` to get additional information

```
open-attestation deploy
open-attestation document-store
open-attestation encrypt
open-attestation filter
open-attestation verify
open-attestation wrap
open-attestation sign
```

## Development

To run on local

```
npm run dev -- <command> <options>
```

To run tests

```
npm run test
```

## Performance testing

To run performance testing for OA functionality

### Wrap

Monitor the response time for batched documents wrapping.

The Default command will testing: 2 documents without base64 image in 1 iteration.

```
npm run benchmark
```

The number of documents and iteration can be modified using these options.

- First argument : Number of document for batched wrapping
- Second argument : Number of performance test iteration to achieve higher accuracy
- Third argument : File path for testing ( For window user, please encase the path in " " quotation marks )

Example:

```
npm run benchmark 4 1 performance-tests/unwrapped_document_wImage.json
```
