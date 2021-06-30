# Wrap performance test results

## Machines used

We ran the performance tests on the following machines:

- Machine 1
  - MacOS (BigSur)
  - 3.3GHz Dual-Core Intel Core i7
  - 16GB RAM
  - Graphic intel Iris Graphics 550 1536MB
- Machine 2:
  - Linux Mint 19.1, Cinnamon 4.0.10, Linux Kernel 4.20.13-042013-generic
  - Intel© Core™ i7-8750H CPU @ 2.20GHz × 6
  - 32GB RAM
  - NVIDIA Corporation GP107M (GeForce GTX 1050 Ti Mobile)

## Parameters

Here are the parameters used for the tests:

- number of documents: 1 000, 10 000, 50 000, 100 000, 500 000, 1 000 000
- file used: `unwrapped_document.json` and `unwrapped_document_wImage.json`
- iteration: 5

## Results

We were not able to run test for all the parameters (disk space or memory issues). For those cases, it will be reported as `NA` in the table below.

For each test we will only note the average duration.

### Document without an image (`unwrapped_document.json`)

|           | 1 000 | 10 000 | 50 000 | 100 000 | 500 000 | 1 000 000 |
| --------- | ----- | ------ | ------ | ------- | ------- | --------- |
| Machine 1 | 2.24s | 14.45s | 67.84s | 184.26s | 898.89s | NA        |
| Machine 2 | 0.56s | 5.20s  | 25.69s | 57.35s  | 320.14s | 681.89s   |

### Document with an image (`unwrapped_document_wImage.json`)

|           | 1 000  | 10 000 | 50 000  | 100 000 | 500 000   | 1 000 000 |
| --------- | ------ | ------ | ------- | ------- | --------- | --------- |
| Machine 1 | 5.17s  | 32.14s | 170.59s | 338.51s | 2 239.80s | NA        |
| Machine 2 | 2.48s  | 22.77s | 119.81s | 239.15s | 1 511.12s | NA        |
