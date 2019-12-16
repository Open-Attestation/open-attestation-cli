# Document CLI tool

This CLI tool turns .json documents into any open-attestation verifiable documents. It applies the OpenAttestation algorithm to produce a hash of the json document and then creates a file with the data and proof of integrity.

## Setup

```bash
npm install -g @govtechsg/open-attestation
```

The above command will install the open-attestation CLI to your machine. You will need to have node.js installed to be able to run the command.

## Batching Documents

This command process all documents in the input directory and issue all of them in a single
batch. It will then add the signature to the individual documents.

```bash
open-attestation batch <PathToDocuments> <PathToWrappedDocuments>
```

Example:

```bash
open-attestation batch ./examples/sample-certs/ ./examples/wrapped-certs/

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

You can also provide an optional JSON schema document to perform extra check on the documents

Example:

```bash
open-attestation batch ./examples/sample-certs/ ./examples/wrapped-certs/ ./examples/schema.json

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

The JSON schema parameter also allow for http endpoint returning valid JSON schema:

Example:

```bash
open-attestation batch ./examples/sample-certs/ ./examples/wrapped-certs/ https://gist.githubusercontent.com/Nebulis/dd8198ab76443489e14121dad225d351/raw/693b50a1694942fb3cc6a8dcf5187cc7c75adb58/schema.json

✔  success  Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

## Document privacy filter

This allows document holders to generate valid documents which hides certain evidences. Useful for hiding grades lol.

```bash
open-attestation filter <inputDocumentPath> <outputDocumentPath> [filters...]
```

Example:

```bash
open-attestation filter wrapped/example.0.json wrapped/example.0.out.json transcript.0.grade transcript.1.grade

✔  success  Obfuscated document saved to: wrapped/example.0.out.json
```

## Version

```
open-attestation --version
```

## Test

```
npm run test
```
