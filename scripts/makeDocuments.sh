#!/bin/bash

# USAGE:
# ./makeDocuments.sh <number of documents>
mkdir -p ./benchmark/raw_documents
seq $1 | xargs -P 4 -I $0 sh -c "cat ./examples/raw-documents/example.0.json | jq '.id = \"https://example.com/ID$0\"' > ./benchmark/raw_documents/cert$0.json"
