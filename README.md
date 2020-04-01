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

```bash
open-attestation wrap <PathToDocuments> <PathToWrappedDocuments>
```

Example:

```bash
open-attestation wrap ./examples/sample-certs/ ./tmp/wrapped-certs/ --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

You can also provide an optional JSON schema document to perform extra check on the documents

Example:

```bash
open-attestation wrap ./examples/sample-certs/ ./tmp/wrapped-certs/ --schema ./examples/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc

open-attestation wrap ./examples/sample-certs/ ./tmp/wrapped-certs/ -s ./examples/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

The JSON schema parameter also allow for http endpoint returning valid JSON schema:

Example:

```bash
open-attestation wrap ./examples/sample-certs/ ./tmp/wrapped-certs/ --schema https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc

open-attestation wrap ./examples/sample-certs/ ./tmp/wrapped-certs/ -s https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

By default the CLI will use open-attestation schema v2 but you can opt in for open-attestation schema v3 using `open-attestation-v3` option:

```bash
open-attestation wrap ./examples/sample-certs/ ./tmp/wrapped-certs/ --open-attestation-v3
open-attestation wrap ./examples/sample-certs/ ./tmp/wrapped-certs/ --oav3
```

## Document privacy filter

This allows document holders to generate valid documents which hides certain evidences. Useful for hiding grades lol.

```bash
open-attestation filter <inputDocumentPath> <outputDocumentPath> [filters...]
```

Example:

```bash
open-attestation filter examples/wrapped-certs/example.0.json tmp/example.0.out.json key1

✔  success  Obfuscated document saved to: tmp/example.0.out.json
```

## Encrypting document

This allows you to encrypt document in order to share and store them safely.

```bash
open-attestation encrypt <inputDocumentPath> <outputEncryptedPath>
```

Example:

```bash
open-attestation encrypt ./examples/wrapped-certs/example.0.json ./tmp/encrypted.json

✔  success   Encrypted document saved to: tmp/encrypted.json
⚠  warning   Here is the key to decrypt the document: don't lose it: 9bac5be27bac31d852fc1e48eb9d5249ec6ad7978da23377b5879f7a24994cb2
```

## Deploying Token Registry

Deploys a token registry contract on the blockchain

```sh
open-attestation deploy token-registry <registry-name> <registry-symbol> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended)

```sh
open-attestation deploy token-registry "My Sample Token" MST --network ropsten

✔  success   Token registry deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

Example - with private key file

```sh
open-attestation deploy token-registry "My Sample Token" MST --network ropsten --key-file ./examples/sample-key

✔  success   Token registry deployed at 0xEb9a6a669c1BA0885827f932F7b49Ce5aA5E0Bd5
```

Example - with in-lined private key

```sh
open-attestation deploy token-registry "My Sample Token" MST --network ropsten --key 0000000000000000000000000000000000000000000000000000000000000003

✔  success   Token registry deployed at 0x4004eAb92033409CBAeC4364ACa2e3A3B6C6448e
```

## Help

Run the command without additional args to get help

```
open-attestation wrap
open-attestation filter
open-attestation encrypt
```

## Test

```
npm run test
```
