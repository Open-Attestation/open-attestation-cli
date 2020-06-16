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
open-attestation wrap <PathToDocumentsOrFile> <PathToWrappedDocuments>
```

Example:

```bash
open-attestation wrap ./examples/raw-documents/ ./tmp/wrapped-documents/ --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

You can also set a single document as input

Example:

```bash
open-attestation wrap ./examples/raw-documents/example.0.json ./tmp/wrapped-documents/ --schema ./examples/schema.json --oav3

✔  success   Batch Document Root: 0x5d318c8083aac18f8075ca2a2eac74b06f2cc37d6ccad680c7c80c9bb36f7be1
```

You can also provide an optional JSON schema document to perform extra check on the documents

Example:

```bash
open-attestation wrap ./examples/raw-documents/ ./tmp/wrapped-documents/ --schema ./examples/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc

open-attestation wrap ./examples/raw-documents/ ./tmp/wrapped-documents/ -s ./examples/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

The JSON schema parameter also allow for http endpoint returning valid JSON schema:

Example:

```bash
open-attestation wrap ./examples/raw-documents/ ./tmp/wrapped-documents/ --schema https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc

open-attestation wrap ./examples/raw-documents/ ./tmp/wrapped-documents/ -s https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json --oav3

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

By default the CLI will use open-attestation schema v2 but you can opt in for open-attestation schema v3 using `open-attestation-v3` option:

```bash
open-attestation wrap ./examples/raw-documents/ ./tmp/wrapped-documents/ --open-attestation-v3
open-attestation wrap ./examples/raw-documents/ ./tmp/wrapped-documents/ --oav3
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

## Deploying Token Registry

Deploys a token registry contract on the blockchain

```bash
open-attestation deploy token-registry <registry-name> <registry-symbol> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-private-key).

```bash
open-attestation deploy token-registry "My Sample Token" MST --network ropsten

✔  success   Token registry deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

## Deploying Document Store

Deploys a document store contract on the blockchain

```bash
open-attestation deploy document-store <store-name> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-private-key).

```bash
open-attestation deploy document-store "My Name" --network ropsten

✔  success   Document store deployed at 0x4B127b8d5e53872d403ce43414afeb1db67B1842
```

## Token registry

### Issue

Issue a hash to a token registry deployed on the blockchain

```bash
open-attestation token-registry issue --address <TOKEN_REGISTRY_ADDRESS> --tokenId <TOKEN_ID> --to <TO> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-private-key).

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

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-private-key).

```bash
open-attestation document-store issue --network ropsten --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1

✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been issued on 0x19f89607b52268D0A19543e48F790c65750869c6
```

### Revoke

Revoke a hash to a document store deployed on the blockchain

```bash
open-attestation document-store revoke --address <DOCUMENT_STORE_ADDRESS> --hash <HASH> [options]
```

Example - with private key set in `OA_PRIVATE_KEY` environment variable (recommended). [More options](#providing-the-private-key).

```bash
open-attestation document-store revoke --network ropsten --address 0x19f89607b52268D0A19543e48F790c65750869c6 --hash 43033b53a462036304f526aeaf3aaeea8d905997d6fde3bb1a02188eadbaaec1

✔  success   Document/Document Batch with hash 0x0c1a666aa55d17d26412bb57fbed96f40ec5a08e2f995a108faf45429ae3511f has been revoked on 0x19f89607b52268D0A19543e48F790c65750869c6
```

## Verify

Verify if a document is valid.

```bash
open-attestation document-store verify --document ./examples/wrapped-documents/example.0.json --network ropsten

…  awaiting  Verifying examples/wrapped-documents/example.0.json
✔  success   The document is valid
```

## Providing the private key

When interacting with blockchain you will likely need to provide your private key. All functions - when the private key is required - will provide 3 ways for you to pass it in:

1. Using `OA_PRIVATE_KEY` environment variable holding the private key(recommended).
1. Using `--key-file` option where you provide a path to a file containing the private key.
1. Using `--key` option where you provide the private key directly to the command (**Note that for this method, the private key may be stored in the machine's bash history**).

Example:

```bash
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

## Help

Run the command with `--help` to get additional information

```
open-attestation deploy
open-attestation document-store
open-attestation encrypt
open-attestation filter
open-attestation verify
open-attestation wrap
```

## Test

```
npm run test
```
