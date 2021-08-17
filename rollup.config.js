import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import shebang from '@walrus/rollup-plugin-shebang';
import multiInput from 'rollup-plugin-multi-input';
import fs from "fs";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import pkge from './package.json'

let filepaths = [];

const walk = (root) => {
  let currentPaths = fs.readdirSync(root);
  for (let path of currentPaths) {
    const abspath = `${root}/${path}`;
    const isFile = /.*\.(ts|js|json)$/.test(path);

    if (isFile) {
      filepaths.push(abspath);
    } else {
      // isDirectory
      walk(abspath);
    }
  }

}

walk('./src/commands');
filepaths.push("./src/index.ts");

// exclude type and test files
filepaths = filepaths
  .filter(path => !path.includes("test"))
  .filter(path => !path.includes("type"));

// console.log(filepaths);

// exclude all dependencies from being bundled together, except for the problematic jsonLd, used by "open-attestation", "oa-verify" dependencies
let deps = [...Object.keys(pkge.dependencies), ...Object.keys(pkge.devDependencies)]
deps = deps.filter( (dep) => !(/oa\-|open-attestation/.test(dep)) )

// console.log(deps);

export default {
  input: filepaths,
  output: {
    dir: 'rollup-build/cjs',
    format: 'cjs',
    exports: 'named'

  },
  external: [...deps],
  plugins: [
      resolve(),
      commonjs(),
      typescript(),
      json(),
      shebang({
        include: './src/index.ts'
      }),
      multiInput()
  ],
};
