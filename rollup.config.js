import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import shebang from "@walrus/rollup-plugin-shebang";
import multiInput from "rollup-plugin-multi-input";
import fs from "fs";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import pkge from "./package.json";

// Right now,  vercel/pkg  does not support ESM libraries (https://github.com/vercel/pkg/issues/782)
// For example, some files rely on @govtechsg/open-attestation, @govtechsg/oa-XX. These libraries in turn rely on jsonLd library, which is an ESM library
// To bypass this issue, files that rely on the ESM libraries can be bundled into a single JS file,
// thereby removing the problematic import / export statements.

// traverse through the directory recursively to get all file paths relative to root directory
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const traverseAndGetFilePaths = (root, filepaths = []) => {
  let currentPaths = fs.readdirSync(root);
  for (let path of currentPaths) {
    const absPath = `${root}/${path}`;

    const isFile = /.*\.(ts|js|json|file)$/.test(path);
    const isDirectory = !isFile;

    // exclude type and test files
    const isTestFile = path.includes("test");
    const isTypeFile = path.includes("type");
    const isRegularFile = isFile && !(isTestFile || isTypeFile);

    if (isRegularFile) {
      filepaths.push(absPath);
    } else if (isDirectory) {
      traverseAndGetFilePaths(absPath, filepaths);
    }
  }
  return filepaths;
};

const filepaths = traverseAndGetFilePaths("./src/commands");
filepaths.push("./src/index.ts");

console.log({ filepaths });

// exclude all external dependencies from being bundled together, except for the problematic jsonLd, used by "@govtechsg/open-attestation", "@govtechsg/oa-XX" dependencies
// helpful guide on externals: https://www.mixmax.com/engineering/rollup-externals
let deps = [...Object.keys(pkge.dependencies), ...Object.keys(pkge.devDependencies)];
deps = deps.filter((dep) => !dep.startsWith("@govtechsg"));

console.log({ deps });

export default {
  input: filepaths,
  output: {
    dir: "rollup-build/cjs",
    format: "cjs",
    exports: "named",
  },
  external: [...deps],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ module: "esnext" }),
    json(),
    shebang({
      include: "./src/index.ts",
    }),
    multiInput(),
  ],
};

// Explaination of plugins[]
/*
resolve: By default, rollup does not know how to find node modules. For example, for the line, `import axios from "axios" `, rollup thinks that there is a
relative file called axios.js
commonJS: Convert CommonJS modules to ES6, so they can be included in a Rollup bundle. Rollup only recognises es6 js files.
typescript(): Convert typescript to js so that rollup can process. rollup only works on js files by default
json(): Rollup only recognises js file. json() s.json files to ES6 modules
shebang(): to preserver the shebang line #!/usr/bin/env node in src/index.ts
multiInput(): By default Rollup bundles every files into a single file from a single entry point. multiinput() allow us to have multiple entry points and
multiple output paths.
*/
