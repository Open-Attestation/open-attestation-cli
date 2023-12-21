# OpenAttestation (CLI)

This command line interface tool in the [OpenAttestation CLI](https://github.com/Open-Attestation/open-attestation-cli) repository turns `.json` documents into OpenAttestation verifiable documents. It applies OpenAttestation algorithm to produce a hash of the `.json` document, and then creates a file with the data and proof of integrity.

## Installation

There are three ways to install the CLI, including binary, NPM, and NPX.

### Binary

To install the binary on your operating system, download the corresponding file from the [CLI release page](https://github.com/Open-Attestation/open-attestation-cli/releases).

>**Note:** There is an existing issue that the size of the binaries must be reduced, which is tracked in GitHub. If you want to contribute your feedback to resolve it, see [this issue here](https://github.com/Open-Attestation/open-attestation-cli/issues/68).

### NPM

If you are a Linux or MacOS user with `npm` installed on your machine, you can also install the CLI using the following command:

```bash
npm install -g @govtechsg/open-attestation-cli
```

The above command will install the open-attestation CLI to your machine. Be sure to have `node.js` installed, so that you can run the command.

### NPX 
You can also opt to use `npx` for the installation:

```bash
npx -p @govtechsg/open-attestation-cli open-attestation <arguments>
```

No matter which way you choose, once the installation process is complete, a configuration folder will be created in the `~/.config/open-attestation/` folder.

>**Important:** On this website, the CLI is referred to as `open-attestation` when you run a command. The assumption is the CLI is available in your execution path. If not, you must change `open-attestation` to reflect the full path to the executable.

---

## Supported networks

| Network ID | Name                     | Network      | Type       |
| ---------- | ------------------------ | ------------ | ---------- |
| `1`        | Ethereum Mainnet         | `mainnet`    | Production |
| `11155111` | Ethereum Testnet Sepolia | `sepolia`    | Test       |
| `137`      | Polygon Mainnet          | `polygon`    | Production |
| `80001`    | Polygon Testnet Mumbai   | `mumbai`     | Test       |
| `50`       | XDC Network              | `xdc`        | Production |
| `51`       | XDC Apothem Network      | `xdcapothem` | Test       |


---

## Usage

### Network fees

For more information on network fees, see the [ ethereum documentation](https://ethereum.org/en/developers/docs/gas/).

#### Adjusting preset gas price

To adjust transaction gas price, use the `priority` variable to scale against the market price.

>**Calculation:** Priority \* Previous block priority fee = Priority fee to use

The table below shows some examples:

| Priority | Previous block priority fee | Priority fee to use |
| -------- | --------------------------- | ------------------- |
| 1        | 1                           | 1 \* 1 = 1          |
| 1.2      | 1                           | 1.2 \* 1 = 1.2      |
| 2        | 1                           | 2 \* 1 = 2          |
| 1        | 10                          | 1 \* 10 = 10        |
| 1.2      | 10                          | 1.2 \* 10 = 12      |
| 2        | 10                          | 2 \* 10 = 20        |

#### Fee information

To display an estimated price of a transaction, use the `--dry-run` option in your command.

The following shows a command example:

```bash
open-attestation deploy document-store "My Name" --network sepolia --dry-run
```

The response looks like:

```bash
/!\ Welcome to the fee table. Please read the information below to understand the transaction fee

The table below display information about the cost of the transaction on the mainnet network, depending on the gas price selected. Multiple modes are displayed to help you choose a gas price depending on your needs:

Information about the network:
Costs based on block number: 4275264
┌─────────┬──────────────┬──────────────────┬─────────────────────────────────┬────────────────────────┐
│ (index) │ block number │ gas price (gwei) │ max priority fee per gas (gwei) │ max fee per gas (gwei) │
├─────────┼──────────────┼──────────────────┼─────────────────────────────────┼────────────────────────┤
│ current │   4275264    │  '0.629067134'   │              '2.5'              │     '3.758131382'      │
└─────────┴──────────────┴──────────────────┴─────────────────────────────────┴────────────────────────┘
Information about the transaction:
Estimated gas required: 869810 gas, which will cost approximately US$0.86837 based on prevailing gas price.
┌──────────┬───────────────────────┬────────────────────┬───────────────────────┐
│ (index)  │       gas cost        │ priority fee price │     max fee price     │
├──────────┼───────────────────────┼────────────────────┼───────────────────────┤
│   GWEI   │   '547168.88382454'   │    '2174525.0'     │  '3268860.25737742'   │
│   ETH    │ '0.00054716888382454' │   '0.002174525'    │ '0.00326886025737742' │
│  ETHUSD  │        0.86837        │      3.45105       │        5.18781        │
│  ETHSGD  │        1.18247        │      4.69931       │        7.06426        │
│ MATICUSD │        0.00027        │      0.00109       │        0.00165        │
│ MATICSGD │        0.00037        │      0.00149       │        0.00225        │
└──────────┴───────────────────────┴────────────────────┴───────────────────────┘
Please read the information above to understand the table
```

#### List of features with the required options

The following is a feature list and the options each feature requires.

| Feature                                                                    | Private Key | Wallet | Aws Kms |
| -------------------------------------------------------------------------- | ----------- | ------ | ------- |
| [Create config](#creating-the-configuration-file)                         | ❎          | ✔️     | ❎      |
| [Deploy document store](#deploying-a-new-document-store)                        | ✔           | ✔      | ✔       |
| [Deploy token registry](#deploying-a-new-token-registry)                        | ✔           | ✔      | ✔       |
| [Dns txt create](#creating-a-temporary-dns-txt-record)                                          | ❎          | ❎     | ❎      |
| [Dns txt get](#getting-the-dns-txt-record-list)                                             | ❎          | ❎     | ❎      |
| [Document store issue](#issuing-a-document-to-document-store)                  | ✔           | ✔      | ✔       |
| [Document store revoke](#revoking-a-document-on-document-store)                | ✔           | ✔      | ✔       |
| [Document store grant ownership](#granting-a-role-on-document-store)            | ✔           | ✔      | ✔       |
| [Document store revoke ownership](#revoking-a-role-on-document-store)          | ✔           | ✔      | ✔       |
| [Document store transfer ownership](#transferring-the-ownership-of-document-store) | ✔           | ✔      | ✔       |
| [Token registry issue](#issuing-a-document-to-token-registry)                  | ✔           | ✔      | ✔       |
| [Token registry mint](#issuing-a-document-to-token-registry)                   | ✔           | ✔      | ✔       |
| [Transaction cancel](#canceling-a-pending-transaction)                          | ✔           | ✔      | ✔       |
| [Wallet create](#creating-a-wallet)                                                   | ❎          | ❎     | ❎      |
| [Wallet decrypt](#decrypting-a-wallet)                                                  | ❎          | ❎     | ❎      |
| [Wallet encrypt](#encrypting-a-wallet)                                                  | ✔           | ❎     | ❎      |
| [Filter (obfuscate) document](#document-privacy-filter)                    | ❎          | ❎     | ❎      |
| [Sign document](#did-direct-signing)                                       | ✔           | ❎     | ❎      |
| [Encrypt document](#encrypting-a-document)                                   | ❎          | ❎     | ❎      |
| [Decrypt document](#decrypting-a-document)                                   | ❎          | ❎     | ❎      |
| [Wrap document](#wrapping-documents)                                       | ❎          | ❎     | ❎      |
| [Unwrap document](#unwrapping-documents)                                   | ❎          | ❎     | ❎      |
| [Verify document](#verifying-a-document)                                                 | ❎          | ❎     | ❎      |
| [Change holder (Title Escrow)](#changing-the-holder)                             | ✔           | ✔      | ✔       |
| [Nominate change of owner (Title Escrow)](#nominating-the-change-of-owner)       | ✔           | ✔      | ✔       |
| [Endorse transfer to owner (Title Escrow)](#endorsing-the-transfer-to-owner)     | ✔           | ✔      | ✔       |
| [Endorse change of owner (Title Escrow)](#endorsing-the-change-of-owner)         | ✔           | ✔      | ✔       |
| [Surrender document (Title Escrow)](#surrendering-a-document)                   | ✔           | ✔      | ✔       |
| [Reject surrendered document (Title Escrow)](#rejecting-a-surrendered-document) | ✔           | ✔      | ✔       |
| [Accept surrendered document (Title Escrow)](#accepting-a-surrendered-document) | ✔           | ✔      | ✔       |

### Wrapping documents

The `wrap` command processes all documents in the input directory. It will add the issuance proofs to the individual documents. Additionally, you'll get the Batch Document Root (`merkleRoot`) value. Thereafter, you can issue all the documents in a single batch with the `merkleRoot` later.

The following shows a command example:

```bash
open-attestation wrap ./examples/raw-documents/example.0.json
```
The response looks like:

```
✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```
#### Specifying the output file while wrapping documents

The `wrap` command will display the result in the console. If you need to save the file, use the `--output-file` option in your command.

The following shows a command example with the `--output-file` option:

```bash
open-attestation wrap ./examples/raw-documents/example.0.json --output-file ./examples/wrapped-documents/example.0.json
```
The response looks like:

```
✔  success   Batch Document Root: 0x5d318c8083aac18f8075ca2a2eac74b06f2cc37d6ccad680c7c80c9bb36f7be1
```
#### Specifying the output directory while wrapping documents

If you need to wrap a folder, use the `--output-dir` option to specify in which folder all the documents will be wrapped.

The following shows a command example with the `--output-dir` option:

```bash
open-attestation wrap ./examples/raw-documents --output-dir ./examples/wrapped-documents
```
The response looks like:

```
✔  success   Batch Document Root: 0x5d318c8083aac18f8075ca2a2eac74b06f2cc37d6ccad680c7c80c9bb36f7be1
```

#### Providing an optional JSON schema while wrapping documents
You can also provide an optional JSON schema document using the `--schema` option to perform an extra check on the documents.

The following shows a command example with the `--schema` option:

```bash
open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ --schema ./examples/schema.json
```

The response looks like:

```
✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

##### Short form of the `--schema` option

Alternatively, you can use `-s` in the command, which is the short form of `--schema`. 

```bash
open-attestation wrap ./examples/raw-documents/ ./examples/wrapped-documents/ -s ./examples/schema.json
```

The response looks like: 
```
✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

##### HTTP endpoint in the `--schema` option 

With the `schema` parameter, an HTTP endpoint will return a valid JSON schema.

The following shows a command example containing an HTTP endpoint:

```bash
open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ --schema https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json
```
The response looks like:

```
✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```
##### HTTP endpoint in the short form `-s`

Similarly, you can also use the short form `-s` to replace the `--schema` option in the command:

```bash
open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ -s https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json
```
The response looks like:

```
✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```
#### Editing a wrapped document

You can also re-wrap a document through editing the wrapped document content and using the `--unwrap` option. 

1. Run the command below to wrap a raw document:

    ```bash
    open-attestation wrap ./examples/raw-documents/example.0.json --output-file ./examples/wrapped-documents/example.0.json
    ```
2. After the first round of wrapping, edit the content in the wrapped document. For example, change your name to another name in `example.0.json`. 

3. To re-wrap the document after editing, run the command below with the `--unwrap` option:

    ```bash
    open-attestation wrap ./examples/wrapped-documents/example.0.json --of ./examples/wrapped-documents/example.1.json --unwrap
    ```

#### Wrapping documents individually

You can disable the `--batched` option to wrap multiple documents individually. Consequently, these documents will not have the same merkle root.

The following shows a command example with the `--batched` option disabled:

```bash
open-attestation wrap ./examples/raw-documents/ --output-dir ./examples/wrapped-documents/ --batched false
```
The response looks like:

```
✔  success   All documents have been individually wrapped
```

#### Changing the OpenAttestation CLI version

By default, the CLI will use OpenAttestation schema V2, but you can opt in for OpenAttestation schema V3 using the `--open-attestation-v3` option:

```bash
open-attestation wrap ./examples/raw-documents/ ./examples/wrapped-documents/ --open-attestation-v3
```
Alternatively, you can use the short form `--oav3` to replace `--open-attestation-v3` in the command:

```bash
open-attestation wrap ./examples/raw-documents/ ./examples/wrapped-documents/ --oav3
```

>**Note:** You should wrap Transferable Records individually, as each of them will be minted to a unique title escrow that represents the document's beneficiary and holder entities. For more information about title escrow, see [here](https://www.openattestation.com/docs/integrator-section/transferable-record/overview).

### Unwrapping documents

The `unwrap` command processes a document in the input directory. It will unwrap the document that has been wrapped to its raw document form, and display it in the console.

The following shows a command example of `unwrap`:

```bash
open-attestation unwrap ./examples/v2/wrapped-documents/example.0.json
```
The response looks like:

```
✔  success   The document has been unwrapped
```

#### Specifying the output file while unwrapping documents

The `unwrap` command will display the result in the console. If you need to save the file, use the `--output-file` option.

The following shows a command example with the `--output-file` option:

```bash
open-attestation unwrap ./examples/v2/wrapped-documents/example.0.json --output-file ./examples/v2/raw-documents/example.0.json
```
The response looks like:

```
✔  success   The document has been unwrapped
```

#### Specifying the output directory while unwrapping documents

If you need to unwrap a folder, use the `--output-dir` option to specify in which folder all the documents will be unwrapped.

The following shows a command example with the `--output-dir` option:

```bash
open-attestation unwrap ./examples/v2/wrapped-documents --output-dir ./examples/v2/raw-documents
```
The response looks like:

```
✔  success   The documents have been individually unwrapped into folder ./examples/v2/raw-documents
```

### Document privacy filter

Using the `filter` command, the document holders can generate valid documents and obfuscate certain fields, such as those fields containing sensitive information that they prefer not to disclose.

The following shows the syntax of the `filter` command:

```bash
open-attestation filter <inputDocumentPath> <outputDocumentPath> [filters...]
```

The following is a command example:

```bash
open-attestation filter examples/wrapped-documents/example.0.json tmp/example.0.out.json key1
```
The response looks like:

```
✔  success  Obfuscated document saved to: tmp/example.0.out.json
```

### Encrypting a document

With the `encrypt` command, you can encrypt the documents to share and store them safely.

The following shows the syntax of the `encrypt` command:

```bash
open-attestation encrypt <inputDocumentPath> <outputEncryptedPath>
```

The following is a command example:

```bash
open-attestation encrypt ./examples/wrapped-documents/example.0.json ./tmp/encrypted.json
```

The response looks like:
```
✔  success   Encrypted document saved to: tmp/encrypted.json
⚠  warning   Here is the key to decrypt the document: don't lose it: 9bac5be27bac31d852fc1e48eb9d5249ec6ad7978da23377b5879f7a24994cb2
```

### Decrypting a document

Using the `decrypt` command, you can decrypt documents that were encrypted using the [encrypt](#encrypting-a-document) method.

The following shows the syntax of the `decrypt` command:

```bash
open-attestation decrypt <input> <output> <key>
```

The following is a command example:

```bash
open-attestation decrypt ./src/__tests__/fixture/did-dns-encrypted.json decrypted.json 88da9b9cd61cfc1677ae7e79dba9b3aeba4b40c95f94c950759e76c6210b5402
```
The response looks like:

```
✔  success   Decrypted document saved to: decrypted.json
```

### Token Registry

#### Deploying a new Token Registry

The `deploy token-registry` command deploys a token registry contract on the blockchain. You can use the `--factory-address` flag with the Factory Contract that were deployed using this command. 

To deploy a standalone token registry, refer to the [Token-Registry](https://github.com/Open-Attestation/token-registry) repository.

The following shows the syntax of the `deploy token-registry` command:

```bash
open-attestation deploy token-registry <registry-name> <registry-symbol> --factory-address <factory-address> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 

```bash
open-attestation deploy token-registry "My Sample Token" MST --network sepolia
```

The response looks like:

```
✔  success   Token registry deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

#### Issuing a document to token registry

The `token-registry issue` command issues a hash to a token registry deployed on the blockchain. The `--tokenId` option indicates the document hash, and the `--to` option indicates the title escrow address to which the document is mapped.

<!--Flag: The syntax below didn't mention the `--to` option. The command example mentions `--to` option, but did not show how to use `--beneficiary` or `--holder` options.-->

The following shows the syntax of the `token-registry issue` command:

```bash
open-attestation token-registry issue --network <NETWORK> --address <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --beneficiary <BENEFICIARY> --holder <HOLDER> [options]
```
>**Important:** In this command, you can use `mint` instead of `issue` and they will be strictly equivalent.

See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 

```bash
open-attestation token-registry mint --network sepolia --address 0x6133f580aE903b8e79845340375cCfd78a45FF35 --tokenId 0x10ee711d151bc2139473a57531f91d961b639affb876b350c31d031059cdcc2c --to 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```
The response looks like:

```
✔  success   Token with hash 0x10ee711d151bc2139473a57531f91d961b639affb876b350c31d031059cdcc2c has been issued on 0x6133f580aE903b8e79845340375cCfd78a45FF35 with the initial recipient being 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Token Registry roles

The interfaces for the assignment and revocation of roles are available in [the Token Registry repository](https://github.com/Open-Attestation/token-registry).

### Document Store

#### Deploying a new document store

The `deploy document-store` command deploys a document store contract on the blockchain. 

The following shows the command syntax:

```bash
open-attestation deploy document-store <store-name> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 

```bash
open-attestation deploy document-store "My Name" --network sepolia
```
The response looks like:

```
✔  success   Document store deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```
##### Specifying a different owner

By default, the owner of the document store will be the deployer. You can specify a different owner using the `--owner` option. 

The following shows a command example:

```bash
open-attestation deploy document-store "My Name" --owner 0x1234 --network sepolia
```

#### Issuing a document to document store

The `document-store issue` command issues a hash to a document store deployed on the blockchain.

The following shows the command syntax:

```bash
open-attestation document-store issue --address <DOCUMENT_STORE_ADDRESS> --hash <HASH> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable.


```bash
open-attestation document-store issue --network sepolia --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 0x43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1
```
The response looks like:

```
✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been issued on 0x19f89607b52268D0A19543e48F790c65750869c6
```

#### Revoking a document on document store

The `document-store revoke` command revokes a hash to a document store deployed on the blockchain.

The following shows the command syntax:

```bash
open-attestation document-store revoke --address <DOCUMENT_STORE_ADDRESS> --hash <HASH> [options]
```

See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable.


```bash
open-attestation document-store revoke --network sepolia --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 0x43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1
```
The response looks like:

```
✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been revoked on 0x19f89607b52268D0A19543e48F790c65750869c6
```

#### Granting a role on document store

The `document-store grant-role` command grants a role on the document store deployed on the blockchain to a wallet.

The following shows the command syntax:

```bash
open-attestation document-store grant-role --address <DOCUMENT_STORE_ADDRESS> --account <ACCOUNT_ADDRESS> --role <ROLE> [options]
```

The `--role` option accepts the following values: 

- `admin`
- `issuer`
- `revoker`

See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable.


```bash
open-attestation document-store grant-role --address 0x80732bF5CA47A85e599f3ac9572F602c249C8A28 --new-owner 0xf81ea9d2c0133de728d28b8d7f186bed61079997 --role admin --network sepolia
```
The response looks like:

```
✔  success   Document store 0x80732bF5CA47A85e599f3ac9572F602c249C8A28's role of: admin has been granted to wallet 0xf81ea9d2c0133de728d28b8d7f186bed61079997
```

#### Revoking a role on document store

The `document-store revoke-role` command revokes a role on the document store deployed on the blockchain to a wallet.

The following shows the command syntax:

```bash
open-attestation document-store revoke-role --address <DOCUMENT_STORE_ADDRESS> --account <ACCOUNT_ADDRESS> --role <ROLE> [options]
```

The `--role` option accepts the following values: 

- `admin`
- `issuer`
- `revoker`

See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable.
 

```bash
open-attestation document-store revoke-role --address 0x80732bF5CA47A85e599f3ac9572F602c249C8A28 --new-owner 0xf81ea9d2c0133de728d28b8d7f186bed61079997 --role admin --network sepolia
```

The response looks like:

```
✔  success   Document store 0x80732bF5CA47A85e599f3ac9572F602c249C8A28's role of: admin has been revoked from wallet 0xf81ea9d2c0133de728d28b8d7f186bed61079997
```

#### Transferring the ownership of document store

The `document-store transfer-ownership` command transfers the ownership of a document store deployed on the blockchain to another wallet.

The following shows the command syntax:

```bash
open-attestation document-store transfer-ownership --address <DOCUMENT_STORE_ADDRESS> --new-owner <HASH> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 

```bash
open-attestation document-store transfer-ownership --address 0x80732bF5CA47A85e599f3ac9572F602c249C8A28 --new-owner 0xf81ea9d2c0133de728d28b8d7f186bed61079997 --network sepolia
```

The response looks like:
```
✔  success   Ownership of document store 0x80732bF5CA47A85e599f3ac9572F602c249C8A28 has been transferred to new wallet 0xf81ea9d2c0133de728d28b8d7f186bed61079997
```

### Verifying a document

The `verify` command runs the verification to check if a document is valid.

The following is a command example:

```bash
open-attestation verify --document ./examples/wrapped-documents/example.0.json --network sepolia
```
The response looks like:

```
…  awaiting  Verifying examples/wrapped-documents/example.0.json
✔  success   The document is valid
```

### DID direct signing

The `sign` command signs on an OA document directly with a private key.

The following is a command example:

```bash
open-attestation sign ./examples/unsigned-documents -f ./examples/sample-key -p did:ethr:0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69#controller --output-dir ./examples/signed-documents
```

### DNS TXT record

You can create, retrieve, or filter DNS TXT records using the commands below.

#### Creating a temporary DNS TXT record

The `dns text-record create` command creates a temporary DNS TXT record in the OpenAttestation sandbox.

The following is a command example:

```bash
open-attestation dns txt-record create --address 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc --networkId 10
```
The response looks like:

```
✔  success   Record created at exotic-blush-primate.sandbox.openattestation.com and will stay valid until Thu Jul 02 2020 13:51:34 GMT+0800 (Singapore Standard Time)
```

#### Getting the DNS TXT record list

The `dns txt-record get` command gets the list of DNS TXT records associated to a domain.

The following is a command example:

```bash
open-attestation dns txt-record get --location resulting-magenta-locust.sandbox.openattestation.com
```
The response looks like:

```
┌─────────┬────────────┬────────────┬───────┬──────────┬────────┐
│ (index) │    type    │    net     │ netId │   addr   │ dnssec │
├─────────┼────────────┼────────────┼───────┼──────────┼────────┤
│    0    │ 'openatts' │ 'ethereum' │ '10'  │ '0xabcd' │ false  │
└─────────┴────────────┴────────────┴───────┴──────────┴────────┘
```
#### Filtering the DNS TXT record list

You can use the `dns txt-record get` command with the `--networkId` option to filter the list of DNS TXT records associated to a domain on a specific network.

The following is a command example:

```bash
open-attestation dns txt-record get --location example.openattestation.com --networkId 3
```
The response looks like:

```
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

You can create, encrypt, decrypt, or provide a wallet using the commands below.

#### Creating a wallet

The `wallet create` command creates a new wallet.

The following is a command example:

```bash
open-attestation wallet create --of ./tmp
```

The response looks like:

```
ℹ  info      Creating a new wallet
? Wallet password [hidden]
…  awaiting  Encrypting Wallet [====================] [100/100%]
ℹ  info      Wallet with public address 0x6348a96D96D56665C2E9619f81355918779f3d9E successfully created. Find more details:
✔  success   Wallet successfully saved into /path/to/tmp
```

#### Encrypting a wallet 

Using the `wallet encrypt` command, you can encrypt a wallet.

>**Note:** If you want to provide the wallet private key, see the ["Providing the wallet"](#providing-the-wallet) section.

The following is a command example:

```bash
open-attestation wallet encrypt --of ./tmp
```

The response looks like:

```
ℹ  info      Encrypting a wallet
? Wallet password [hidden]
…  awaiting  Encrypting Wallet [====================] [100/100%]
ℹ  info      Wallet with public address 0xB26B4941941C51a4885E5B7D3A1B861E54405f90 successfully created. Find more details:
✔  success   Wallet successfully saved into /path/to/tmp

```

#### Decrypting a wallet

The `wallet decrypt` command decrypts a wallet to get its information.

>**Important:** Some information revealed by this command can be sensitive, e.g. the wallet private key.

The following is a command example:

```bash
open-attestation wallet decrypt wallet.json
```

The response looks like:

```
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

#### Providing the wallet

When interacting with blockchain, you may need to provide a way to access your wallet. When the wallet is required, all functions will provide multiples ways for you to provide the wallet information:

1. It is recommended to use the `--encrypted-wallet-path` option where you provide a path to an [encrypted wallet](https://docs.ethers.io/v5/api/signer/#Wallet-encrypt).

1. Use the `OA_PRIVATE_KEY` environment variable to hold the private key.

1. Use the `--key-file` option where you provide a path to a file containing the private key.

1. Use the `--key` option where you provide the private key directly to the command.

>**Important:** When you use the `--key` option, the private key may be stored in the machine's bash history.

The following is a code example using the `--encrypted-wallet-path` option:

```bash
open-attestation deploy document-store "My Name" --network sepolia --encrypted-wallet-path /path/to/wallet.json
```
The response looks like:

```bash
# Then you will be prompted to type your password to decrypt the wallet
? Wallet password [input is hidden]

# Using environment variable
export OA_PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000001
open-attestation deploy document-store "My Name" --network sepolia
unset OA_PRIVATE_KEY

# Using private key stored in file
echo -n 0000000000000000000000000000000000000000000000000000000000000002 >> ./examples/sample-key
open-attestation deploy document-store "My Name" --network sepolia --key-file ./examples/sample-key
rm ./examples/sample-key

# Providing the key to the command
open-attestation deploy document-store "My Name" --network sepolia --key 0000000000000000000000000000000000000000000000000000000000000003
```

### Creating the configuration file

The `config create` command generates a configuration file named `config.json` with sandbox DNS, document store, and token registry.

>**Note:** You need a `wallet.json` file with sufficient **funds** in the specified network for this command to work.

You can use the following options in this command:

- `--output-dir` option specifies in which folder the configuration file will be created.
- `--encrypted-wallet-path` option indicates a path to an [encrypted wallet](https://docs.ethers.io/v5/api/signer/#Wallet-encrypt).

- `--config-template-url` option provides a path to reference a configuration template file hosted on a public URL. To learn more, see [Method 1](#method-1-using-the-config-template-url-option-recommended).

- `--config-template-path` option provides a path to reference a config template file locally. To learn more, see [Method 2](#method-2-using-the-config-template-path-option).

There are two ways of using this command to generate a configuration file. Both ways will return a new configuration file with the sandbox DNS, updated document store, and updated token registry.

#### Method 1: Using the `config-template-url` option (recommended)

These are the reference config templates:

- [V2 config template](https://raw.githubusercontent.com/TradeTrust/tradetrust-config/master/build/reference/config-v2.json)
- [V3 config template](https://raw.githubusercontent.com/TradeTrust/tradetrust-config/master/build/reference/config-v3.json)

Step 1. Generate a `wallet.json` file and add funds into `wallet.json`.

>**Note:** Skip Step 1 if you already have a `wallet.json` file with sufficient funds in the specified network.

The following is a command example:

```bash
open-attestation wallet create --output-file wallet.json
```

>**Note:** Currently, OpenAttestation does not provide any faucet to dispense funds into `wallet.json`. You can search online for some faucets.

Step 2. Generate the configuration file by providing the `wallet.json` file you created and a URL to the configuration file template.

The following is a command example:

```
open-attestation config create --output-dir ./example-configs --encrypted-wallet-path </path/to>/wallet.json
```
The response looks like the following, in which you need to provide certain information:

```
// Please fill in the necessary information when prompted.
ℹ  info      Creating a new config file
? Wallet password [hidden]
? Using a config template URL? Yes
? Please enter the config template URL https://raw.githubusercontent.com/TradeTrust/tradetrust-config/master/build/reference/config-v2.json
? Select Network sepolia
```

#### Method 2: Using the `config-template-path` option

Step 1. Generate a `wallet.json` file and add funds into `wallet.json`.

>**Note:** Skip Step 1 if you already have a `wallet.json` file with sufficient funds in the specified network.

The following is a command example:

```bash
open-attestation wallet create --output-file wallet.json
```

>**Note:** Currently, OpenAttestation does not provide any faucet to dispense funds into `wallet.json`. You can search online for some faucets.

Step 2. Generate the configuration file by providing the `wallet.json` file you created and an existing configuration file.

The following is a command example:

```bash
open-attestation config create --output-dir ./example-configs --encrypted-wallet-path </path/to>/wallet.json
```
The response looks like the following, in which you need to provide certain information:

```
// Please fill in the necessary information when prompted.
ℹ  info      Creating a new config file
? Wallet password [hidden]
? Using a config template URL? No
? Please enter the config template path </path/to>/config.json
? Select Network sepolia
```

### Canceling a pending transaction

The `transaction cancel` command cancels a pending transaction.

>**Important:** This action is irreversible.

You need to use the following options:

- `--nonce` option specifies which transaction is to be canceled.

- `--gas-price` option specifies the gas price, which is required to be higher than the pending transaction.

- `--transaction-hash` option can be used as an alternative to the `--nonce` and `--gas-price` options. It will automatically increase the transaction gas price by 100%.

- To learn more about the options for providing the wallet, see [this GitHub readme](https://github.com/Open-Attestation/open-attestation-cli#providing-the-wallet).

The following is the command syntax:

```bash
open-attestation transaction cancel --nonce <pending transaction nonce> --gas-price <gas price> [option]
```

The following shows a command example with the `--nonce` option:

```bash
open-attestation transaction cancel --nonce 1 --gas-price 300 --network sepolia --encrypted-wallet-path /path/to/wallet
```
The following shows another example with the `--transaction-hash` option:

```bash
open-attestation transaction cancel --transaction-hash 0x000 --network sepolia --encrypted-wallet-path /path/to/wallet
```

### Title escrow

#### Changing the holder

Using the `title-escrow change-holder` command, the owner of a transferable record can change the holder.

The following shows the command syntax:

```bash
open-attestation title-escrow change-holder --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newHolder <NEW_HOLDER> [options]
```

See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 


```bash
open-attestation title-escrow change-holder --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --newHolder 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```
The response looks like:

```
✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully changed to holder with address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Nominating the change of owner

With the `title-escrow nominate-change-owner` command, the owner of the transferable record can nominate a new owner.

>**Important:** This command will fail if you are not the owner of the transferable record.

The following shows the command syntax:

```bash
open-attestation title-escrow nominate-change-owner --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newOwner <NEW_OWNER_ADDRESS> [options]
```

See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable.
 

The following shows a command example:

```bash
open-attestation title-escrow nominate-change-owner --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --newOwner 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```
The response looks like:

```
✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully nominated to new owner with address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Endorsing the transfer to owner

Using the `title-escrow endorse-transfer-owner` command, the transferable record holder can endorse the transfer to an approved owner and holder.

>**Important:** This command will fail if there is no approved owner or holder information on the transferable record.

The following is the command syntax:

```bash
open-attestation title-escrow endorse-transfer-owner --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newBeneficiary <NEW_OWNER> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 


The following shows a command example:

```bash
open-attestation title-escrow endorse-transfer-owner --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --newBeneficiary 0x2f60375e8144e16Adf1979936301D8341D58C36C
```
The response looks like:

```
✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully endorsed to approved beneficiary at 0x2f60375e8144e16Adf1979936301D8341D58C36C
```

#### Endorsing the change of owner

Using the `title-escrow endorse-change-owner` command, the transferable record owner can endorse the change to a new owner and holder.

>**Important:** This command will fail if the new holder and owner's addresses you provide are the same as the current owner and holder's addresses.

The following is the command syntax:

```bash
open-attestation title-escrow endorse-change-owner --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --newOwner <NEW_OWNER_ADDRESS> --newHolder <NEW_HOLDER_ADDRESS> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 


```bash
open-attestation title-escrow endorse-change-owner --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --newOwner 0xB26B4941941C51a4885E5B7D3A1B861E54405f90 --newHolder 0x2f60375e8144e16Adf1979936301D8341D58C36C
```
The response looks like:
```
✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990's holder has been successfully endorsed to new owner with address 0x2f60375e8144e16Adf1979936301D8341D58C36C and new holder with address: 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

#### Surrendering a document

With the `title-escrow surrender` command, the entity (who is both an owner and a holder) can surrender the transferable record to the token registry.

The following is the command syntax:

```bash
open-attestation title-escrow surrender --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 


```bash
open-attestation title-escrow reject-surrendered --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --network sepolia
```
The response looks like:

```
✔  success   Transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 has been surrendered.
```

#### Rejecting a surrendered document

With the `title-escrow reject-surrendered` command, the token registry can reject a surrendered transferable record.

The following shows the command syntax:

```bash
open-attestation title-escrow reject-surrendered --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 


```bash
open-attestation title-escrow reject-surrendered --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --network sepolia
```
The response looks like:
```
✔  success   Surrendered transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 has been rejected.
```

#### Accepting a surrendered document

Using the `title-escrow accept-surrendered` command, the token registry will be able to accept a surrendered transferable record.

The following shows the command syntax:

```bash
open-attestation title-escrow accept-surrendered --token-registry <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> [options]
```
See more options [here](#providing-the-wallet).

The following command is a recommended example with the private key set in the `OA_PRIVATE_KEY` environment variable. 


```bash
open-attestation title-escrow accept-surrendered --token-registry 0x4933e30eF8A083f49d14759b2eafC94E56F0b3A7 --tokenId 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 --network sepolia
```
The response looks like:

```
✔  success   Surrendered transferable record with hash 0x951b39bcaddc0e8882883db48ca258ca35ccb01fee328355f0dfda1ff9be9990 has been accepted.

```

## Help

To get additional information, run each of the following commands with the `--help` option:

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

To start a development server on the local machine, run the command below:

```
npm run dev -- <command> <options>
```

To run tests for your projects, run the command below:

```
npm run test
```

## Performance testing

To run performance testing for OA functionality, follow the instructions below.

### Wrap

Using the `npm run benchmark` command, you can monitor the response time spent on wrapping a batch of documents.

The default command (with no options) will test two documents without `base64` image in one iteration:

```
npm run benchmark
```

The number of documents and iterations can be modified using these options below:

- First argument: The number of documents for batched wrapping
- Second argument: The number of performance test iterations to achieve higher accuracy
- Third argument: The file path for testing 

    >**Important:** For the Windows user, be sure to provide the file path in quotation marks "".

The following is a command example, testing four documents in one iteration from the specified path:

```bash
npm run benchmark 4 1 performance-tests/unwrapped_document_wImage.json
```
