#!/bin/bash

# USAGE:
# ./makeCerts.sh <number of certs>
mkdir -p ./benchmark/unwrapped_certs
seq $1 | xargs -P 4 -I $0 sh -c "cat ./examples/sample-certs/example.0.json | jq '.id = \"ID$0\"' > ./benchmark/unwrapped_certs/cert$0.json"
