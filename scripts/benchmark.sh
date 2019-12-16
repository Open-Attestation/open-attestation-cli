#!/bin/bash

time node index.js batch ./benchmark/unwrapped_certs ./benchmark/wrapped_certs
rm -rf ./benchmark/wrapped_certs
time node index.js batch ./benchmark/unwrapped_certs ./benchmark/wrapped_certs
rm -rf ./benchmark/wrapped_certs
time node index.js batch ./benchmark/unwrapped_certs ./benchmark/wrapped_certs
