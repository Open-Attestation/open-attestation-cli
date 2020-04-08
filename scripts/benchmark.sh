#!/bin/bash

time npx ts-node --project ./tsconfig.json ./src/index wrap ./benchmark/raw_documents ./benchmark/wrapped_documents --oav3
rm -rf ./benchmark/wrapped_documents
time npx ts-node --project ./tsconfig.json ./src/index wrap ./benchmark/raw_documents ./benchmark/wrapped_documents --oav3
rm -rf ./benchmark/wrapped_documents
time npx ts-node --project ./tsconfig.json ./src/index wrap ./benchmark/raw_documents ./benchmark/wrapped_documents --oav3
