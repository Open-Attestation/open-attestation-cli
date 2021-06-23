import { copyFile } from "fs/promises";
import { Output, wrap } from "../src/implementations/wrap";
import { performance } from "perf_hooks";
import { existsSync, mkdirSync, rmdirSync } from "fs";
import { SchemaId } from "@govtechsg/open-attestation";
import yargs from "yargs";
import { join } from "path";

const DEFAULT_NUMBER_OF_FILE = 2;
const DEFAULT_ITERATION = 1;
const DEFAULT_FILE_PATH = join(__dirname, "/unwrapped_doc.json");
const INPUT_UNWRAPPED_FILE_FOLDER = join(__dirname, "/raw-documents");
const OUTPUT_WRAPPED_FILE_FOLDER = join(__dirname, "/wrapped-documents");

// Setup number of files using mocked json
const setup = async (filePath: string, numberOfFiles: number): Promise<void> => {
  console.info("Setup up files for testing");
  const fileNameArray = filePath.split("/").pop();
  if (fileNameArray != undefined) {
    const mockFileName = fileNameArray.split(".")[0];
    const mockFileExtension = fileNameArray.split(".")[1];

    try {
      existsSync(INPUT_UNWRAPPED_FILE_FOLDER) || mkdirSync(INPUT_UNWRAPPED_FILE_FOLDER);
      for (let index = 0; index < numberOfFiles; index++) {
        await copyFile(filePath, `${INPUT_UNWRAPPED_FILE_FOLDER}/${mockFileName + (index + 1)}.${mockFileExtension}`);
      }
    } catch (e) {
      console.error(e);
    }
  }
};

// Destroy generated folder
const destroy = (): void => {
  console.info("Cleaning generated files from setup");
  !existsSync(INPUT_UNWRAPPED_FILE_FOLDER) || rmdirSync(INPUT_UNWRAPPED_FILE_FOLDER, { recursive: true });
  !existsSync(OUTPUT_WRAPPED_FILE_FOLDER) || rmdirSync(OUTPUT_WRAPPED_FILE_FOLDER, { recursive: true });
};

// Monitor batched wrap feature for the response time
const monitorWrapFeature = async (numberOfFiles: number, iteration: number): Promise<void> => {
  try {
    // Setup Mocked Files
    await setup(DEFAULT_FILE_PATH, numberOfFiles);

    const responseTime: Array<number> = [];
    for (let index = 0; index < iteration; index++) {
      // Start monitoring
      console.info(`Iteration ${index + 1} : Start monitoring`);
      const startTime = performance.now();

      // Call OA CLI wrap
      console.info(`Iteration ${index + 1} : Wrapping Documents`);
      await wrap({
        inputPath: INPUT_UNWRAPPED_FILE_FOLDER,
        outputPath: OUTPUT_WRAPPED_FILE_FOLDER,
        version: SchemaId.v2,
        unwrap: false,
        outputPathType: Output.Directory,
        batched: true,
      });

      // Stop monitoring
      console.info(`Iteration ${index + 1} : Stop monitoring`);
      const endTime = performance.now();
      responseTime.push(endTime - startTime);
    }

    // Destroy Mocked Files
    destroy();

    // Print time to execute
    console.info(`-----Summary-----`);
    const sumResponseTime: number = responseTime.reduce((a: number, b: number) => a + b, 0);
    const avgResponseTime: number = sumResponseTime / responseTime.length || 0;
    if (iteration > 1) {
      responseTime.map((time: any, index: number) => {
        console.info(`Iteration ${index + 1} : ${time} ms. (${time / 1000} s)`);

        if (responseTime.length - 1 == index) {
          const fastestTime = Math.min(...responseTime);
          const slowestTime = Math.max(...responseTime);
          console.info(`Slowest Response Time : ${fastestTime} ms. (${fastestTime / 1000} s)`);
          console.info(`Fastest Response Time : ${slowestTime} ms. (${slowestTime / 1000} s)`);
          console.info(`Average Response Time : ${avgResponseTime} ms. (${avgResponseTime / 1000} s)`);
        }
        return undefined;
      });
    } else {
      console.info(`OA Wrap took ${avgResponseTime} ms. (${avgResponseTime / 1000} s)`);
    }
  } catch (e) {
    // Destroy Mocked Files
    destroy();
    console.error(e.message);
  }
};

yargs
  .command(
    "wrap",
    "performance test for oa wrap feature",
    function (yargs) {
      return yargs
        .option("numberOfFiles", {
          describe: "Number of file batched",
          type: "number",
          default: DEFAULT_NUMBER_OF_FILE,
        })
        .option("iteration", {
          describe: "Number of iteration",
          type: "number",
          default: DEFAULT_ITERATION,
        });
    },
    function (argv) {
      const numberOfFiles = argv.numberOfFiles;
      const iteration = argv.iteration;
      monitorWrapFeature(numberOfFiles, iteration);
    }
  )
  .help().argv;
