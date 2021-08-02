import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import shebang from '@walrus/rollup-plugin-shebang';
import multiInput from 'rollup-plugin-multi-input';
import fs from "fs";
import commonjs from '@rollup/plugin-commonjs';

let filepaths = [];

const walk = (root) => {
  let currentPaths = fs.readdirSync(root);
  for (let path of currentPaths) {
    const abspath = `${root}/${path}`;
    const isFile = /.*\.(ts|js|json)$/.test(path);
    // ignore type files, e.g. foo.type(s).ts
    const isTypeFile = /\.type/.test(path);

    if (isFile && !isTypeFile) {
      filepaths.push(abspath);
      continue;
    }

    const isDirectory = !isFile;
    if (isDirectory) {
      walk(abspath);
    }
  }

}

walk('./src/commands');
filepaths.push("./src/index.ts");
console.log(filepaths);

export default {
  input: filepaths,
  output: {
    dir: 'dist',
    format: 'es'

  },
  plugins: [
      typescript(),
      commonjs(),
      json(),
      shebang({
        include: './src/index.ts'
      }),
      multiInput({ relative: 'src/' })
  ],
};