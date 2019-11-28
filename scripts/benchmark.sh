#!/bin/bash

time node index.js batch ./benchmark/unsigned_certs ./benchmark/signed_certs
rm -rf ./benchmark/signed_certs
time node index.js batch ./benchmark/unsigned_certs ./benchmark/signed_certs
rm -rf ./benchmark/signed_certs
time node index.js batch ./benchmark/unsigned_certs ./benchmark/signed_certs
