# Document CLI tool

This CLI tool turns .json documents into any open-attestation verifiable documents. It applies the OpenAttestation algorithm to produce a hash of the json document and then creates a file with the data and proof of integrity.

## Setup

```bash
npm install -g @govtechsg/open-attestation-cli
```

The above command will install the open-attestation CLI to your machine. You will need to have node.js installed to be able to run the command.

You can also opt to use npx:

```bash
npx -p @govtechsg/open-attestation-cli open-attestation <arguments>
```

## Wrapping Documents

This command process all documents in the input directory and issue all of them in a single
batch. It will then add the issuance proofs to the individual documents.

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

## Document privacy filter

This allows document holders to generate valid documents which hides certain evidences. Useful for hiding grades lol.

```bash
open-attestation filter <inputDocumentPath> <outputDocumentPath> [filters...]
```

Example:

```bash
open-attestation filter examples/wrapped-documents/example.0.json tmp/example.0.out.json key1

✔  success  Obfuscated document saved to: tmp/example.0.out.json
```

## Encrypting document

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

## Decrypting document

This allows you to decrypt document encrypted using the method above.

```bash
open-attestation decrypt <input> <output> <key>
```

Example:

```bash
open-attestation decrypt ./src/__tests__/fixture/did-dns-encrypted.json decrypted.json 88da9b9cd61cfc1677ae7e79dba9b3aeba4b40c95f94c950759e76c6210b5402

✔  success   Decrypted document saved to: decrypted.json
```

## Deploying Token Registry

Deploys a token registry contract on the blockchain

```bash
open-attestation deploy token-registry <registry-name> <registry-symbol> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation deploy token-registry "My Sample Token" MST --network ropsten

✔  success   Token registry deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

## Deploying Document Store

Deploys a document store contract on the blockchain

```bash
open-attestation deploy document-store <store-name> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation deploy document-store "My Name" --network ropsten

✔  success   Document store deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

## Deploying Paymaster

Deploys a [paymaster](https://docs.opengsn.org/learn/index.html#paymaster) contract on the blockchain. (this is used for GSN network)

```bash
open-attestation deploy paymaster <paymaster-name> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation deploy paymaster "My Name" --network ropsten

…  awaiting  Waiting for transaction 0xf4a222c9bcc31ebd202a110568a7798218477482b773f49290e1df8b4936a313 to be mined
✔  success   Paymaster My Name deployed at 0xC234Fb1F1ef0ABCD1faC90ad12F4DfC97D583F95
```

## Deploying Gsn Capable Document Store

Deploys a [gsn capable document store](https://docs.opengsn.org/) contract on the blockchain. The [Trust Forwarder](https://docs.opengsn.org/learn/index.html#forwarder) for your network is provided by GSN. You can find a the most updated list [here](https://docs.opengsn.org/gsn-provider/networks.html).

```bash
open-attestation deploy gsn-capable-document-store <STORE_NAME> <TRUST_FORWARDER_ADDRESS> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation deploy gsn-capable-document-store "My Name" 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 --network ropsten

✔  success   Document store deployed at 0x0d3dFdd82FF13Ff06a336e28CABE465B64fD8168
```

## Token registry

### Issue

Issue a hash to a token registry deployed on the blockchain

```bash
open-attestation token-registry issue --address <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --to <TO> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation token-registry mint --network ropsten --address 6133f580aE903b8e79845340375cCfd78a45FF35 --to 0xB26B4941941C51a4885E5B7D3A1B861E54405f90 --tokenId 0x10ee711d151bc2139473a57531f91d961b639affb876b350c31d031059cdcc2c


✔  success   Token with hash 0x10ee711d151bc2139473a57531f91d961b639affb876b350c31d031059cdcc2c has been issued on 6133f580aE903b8e79845340375cCfd78a45FF35 with the initial recipient being 0xB26B4941941C51a4885E5B7D3A1B861E54405f90
```

`mint` can be used instead of issue and will be strictly equivalent.

## Document Store

### Issue

Issue a hash to a document store deployed on the blockchain

```bash
open-attestation document-store issue --address <DOCUMENT_STORE_ADDRESS> --hash <HASH> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation document-store issue --network ropsten --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1

✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been issued on 0x19f89607b52268D0A19543e48F790c65750869c6
```

### Revoke

Revoke a hash to a document store deployed on the blockchain

```bash
open-attestation document-store revoke --address <DOCUMENT_STORE_ADDRESS> --hash <HASH> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation document-store revoke --network ropsten --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1

✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been revoked on 0x19f89607b52268D0A19543e48F790c65750869c6
```

## Paymaster

### add-target

Registers a contract with a paymaster deployed on the blockchain. Paymasters only pay for registered contracts.

```bash
open-attestation paymaster add-target --target-address <GSN_CAPABLE_DOCUMENT_STORE_ADDRESS> --paymaster-address <PAYMASTER_ADDRESS> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation paymaster add-target --network ropsten --target-address 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 --paymaster-address 0xcB94584760bCA09e9fa7117C4eE966814f17a306

✔  success   Contract with address 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 has been registered on paymaster 0xcB94584760bCA09e9fa7117C4eE966814f17a306
```

### remove-target

Remove a contract from being paid by a paymaster deployed on the blockchain

```bash
open-attestation paymaster remove-target --target-address <GSN_CAPABLE_DOCUMENT_STORE_ADDRESS> --paymaster-address <PAYMASTER_ADDRESS> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation paymaster remove-target --network ropsten --target-address 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 --paymaster-address 0xcB94584760bCA09e9fa7117C4eE966814f17a306

✔  success   Contract with address 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 has been revoked on paymaster 0xcB94584760bCA09e9fa7117C4eE966814f17a306
```

### supports-contract

Check if given contract is supported by paymaster

```bash
open-attestation paymaster supports-contract --target-address <GSN_CAPABLE_DOCUMENT_STORE_ADDRESS> --paymaster-address <PAYMASTER_ADDRESS> [options]
```

Example -

```bash
open-attestation paymaster supports-contract --network ropsten --target-address 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 --paymaster-address 0xcB94584760bCA09e9fa7117C4eE966814f17a306

ℹ  info      Checking 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 is supported on paymaster 0xcB94584760bCA09e9fa7117C4eE966814f17a306
✔  success   Contract with address 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 is supported paymaster 0xcB94584760bCA09e9fa7117C4eE966814f17a306
```

## Gsn Capable

Gsn Capable denotes any contract with is able to receive relayed transactions. A paymaster should be declared who will sponsor the relayed transaction.

### setPaymaster

This method sets a paymaster address for the Gsn Capable recipient contract who will pay the relayer of the meta transaction. Refer [here](https://www.openattestation.com/docs/advanced/gas-station-network#gsncapabledocumentstore) for a detailed use case.

```bash
open-attestation gsn-capable set-paymaster --gsn-capable-address <CONTRACT_ADDRESS> --paymaster-address <PAYMASTER_CONTRACT> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-wallet).

```bash
open-attestation gsn-capable set-paymaster --network ropsten --gsn-capable-address 0x0d3dFdd82FF13Ff06a336e28CABE465B64fD8168 --paymaster-address 0xcB94584760bCA09e9fa7117C4eE966814f17a306

✔ success Paymaster address 0xcB94584760bCA09e9fa7117C4eE966814f17a306 has been successfully set on 0x0d3dFdd82FF13Ff06a336e28CABE465B64fD8168
```

## Verify

Verify if a document is valid.

```bash
open-attestation document-store verify --document ./examples/wrapped-documents/example.0.json --network ropsten

…  awaiting  Verifying examples/wrapped-documents/example.0.json
✔  success   The document is valid
```

## DID Direct Signing

Sign on an OA document directly with a private key.

```bash
open-attestation sign ./examples/unsigned-documents -f ./examples/sample-key -p did:ethr:0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69#controller --output-dir ./examples/signed-documents
```

## DNS TXT record

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

## Wallet

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

## Providing the wallet

When interacting with blockchain you will likely need to provide a way to access your wallet. All functions - when the wallet is required - will provide multiples ways for you to pass it in:

1. Using `encrypted-wallet-path` option where you provide a path to an [encrypted wallet](https://docs.ethers.io/v5/api/signer/#Wallet-encrypt) (recommended).
1. Using `OA_PRIVATE_KEY` environment variable holding the private key.
1. Using `--key-file` option where you provide a path to a file containing the private key.
1. Using `--key` option where you provide the private key directly to the command (**Note that for this method, the private key may be stored in the machine's bash history**).

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

## Providing you own Infura Key

When reading blockchain blocks you will likely need a provider to connect to a node. We use a Infura Provider by `ethers@v5` and have provisioned a API Key for it. We **strongly recommend** using your own key. You can pass it in by following these steps:

1. Generate a API Key by registering for a [Infura account](https://infura.io/) and opening a project.
1. Add API key as an environment variable named `INFURA_KEY`.

Example:

```bash
# Using environment variable
export INFURA_KEY=<put your key here>
open-attestation paymaster supports-contract -p 0xcB94584760bCA09e9fa7117C4eE966814f17a306 -a 0x9Eb76E132fCA96779A5225419352Fb1B3B5Fd706 --network ropsten
unset INFURA_KEY
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

## Test

```
npm run test
```
