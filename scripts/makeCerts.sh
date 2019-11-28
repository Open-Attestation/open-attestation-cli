#!/bin/bash

# USAGE:
# ./makeCerts.sh <number of certs>
mkdir -p ./benchmark/unsigned_certs
seq $1 | xargs -P 4 -I $0 sh -c "cat ./examples/sample-certs/example.0.json | jq '.id = \"ID$0\"' > ./benchmark/unsigned_certs/cert$0.json"