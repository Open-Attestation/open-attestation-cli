import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import shebang from '@walrus/rollup-plugin-shebang';
import multiInput from 'rollup-plugin-multi-input';
import fs from "fs";
import commonjs from '@rollup/plugin-commonjs';
import autoExternal from 'rollup-plugin-auto-external';
import resolve from '@rollup/plugin-node-resolve';

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

console.log(filepaths);

export default {
  input: filepaths,
  output: {
    dir: 'dist/cjs',
    format: 'cjs'

  },
  external: [],
  plugins: [
      resolve(),
      autoExternal(),
      typescript(),
      commonjs(),
      json(),
      shebang({
        include: './src/index.ts'
      }),
      multiInput()
  ],
};