import { execSync } from "child_process";
import { copyFile } from "fs/promises";
import { performance } from "perf_hooks";
import { existsSync, mkdirSync, rmdirSync } from "fs";

const DEFAULT_NUMBER_OF_FILE = 5;
const DEFAULT_ITERATION = 1;
const BASE_PATH = "./performance_test";
const DEFAULT_MOCK_FILE_PATH = `${BASE_PATH}/mock_unwrapped_doc.json`;
const INPUT_MOCK_UNWRAPPED_FILE_FOLDER = `${BASE_PATH}/raw-documents`;
const OUTPUT_MOCK_WRAPPED_FILE_FOLDER = `${BASE_PATH}/wrapped-documents`;

// Setup number of files using mocked json
const setup = async (file_path, numberOfFiles) => {
  var fileNameArray = file_path.split("/").pop();
  var mockFileName = fileNameArray.split(".")[0];
  var mockFileExtension = fileNameArray.split(".")[1];
  try {
    existsSync(INPUT_MOCK_UNWRAPPED_FILE_FOLDER) || mkdirSync(INPUT_MOCK_UNWRAPPED_FILE_FOLDER);
    for (var index = 0; index < numberOfFiles; index++) {
      await copyFile(
        file_path,
        `${INPUT_MOCK_UNWRAPPED_FILE_FOLDER}/${mockFileName + (index + 1)}.${mockFileExtension}`
      );
    }
  } catch (e) {
    console.error(e);
  }
};

// Destroy generated folder
const destroy = () => {
  !existsSync(INPUT_MOCK_UNWRAPPED_FILE_FOLDER) || rmdirSync(INPUT_MOCK_UNWRAPPED_FILE_FOLDER, { recursive: true });
  !existsSync(OUTPUT_MOCK_WRAPPED_FILE_FOLDER) || rmdirSync(OUTPUT_MOCK_WRAPPED_FILE_FOLDER, { recursive: true });
};

// Monitoring wrap function
const monitor = () => {
  return new Promise((resolve, reject) => {
    try {
      // Start monitoring
      var startTime = performance.now();

      // Call OA CLI wrap
      execSync(
        `open-attestation wrap ${INPUT_MOCK_UNWRAPPED_FILE_FOLDER} --output-dir ${OUTPUT_MOCK_WRAPPED_FILE_FOLDER}`,
        { stdio: "inherit" }
      );

      // Stop monitoring
      var endTime = performance.now();

      resolve(endTime - startTime);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
};

const main = async () => {
  try {
    // Monitoring Result
    var responseTime = [];

    // Get User Input
    var file_path = process.env.MOCK_FILE_PATH ?? DEFAULT_MOCK_FILE_PATH;
    var numberOfFiles = process.env.NUMBER_OF_FILE ?? DEFAULT_NUMBER_OF_FILE;
    var iteration = process.env.ITERATION ?? DEFAULT_ITERATION;

    // Setup Mocked Files
    await setup(file_path, numberOfFiles);

    var promiseArray = [];
    for (var index = 0; index < parseInt(iteration); index++) {
      promiseArray.push(monitor());
    }

    responseTime = await Promise.all(promiseArray);
    // Destroy Mocked Files
    destroy();

    // Print time to execute
    const sumResponseTime = responseTime.reduce((a, b) => a + b, 0);
    const avgResponseTime = sumResponseTime / responseTime.length || 0;
    if (iteration > 1) {
      responseTime.map((time, index) => {
        console.info(`Iteration ${index + 1} : ${time} ms. (${time / 1000} s)`);
        return undefined;
      });
    }
    console.info(`OA Wrap took ${avgResponseTime} ms. (${avgResponseTime / 1000} s)`);
  } catch (e) {
    destroy();
    console.error(e.message);
  }
};
main();
