// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
var fs = require('fs');

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

const entryObj = {};

for (let file of filepaths) {
  let key = file.replace('ts', '');
  key = key.replace('/src', '');
  entryObj[key] = file;
}

console.log(entryObj);

const isProduction = process.env.NODE_ENV == "production";

const config = {
  entry: entryObj,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, "build"),
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "path": require.resolve("path-browserify"),
      "util": require.resolve("util"),
      "chardet": require.resolve("chardet"),
      "tty-browserify": require.resolve("tty-browserify"),
      "assert": require.resolve("assert"),
      "constants-browserify": require.resolve("constants-browserify"),
      "tty": require.resolve("tty-browserify"),
      "constants": require.resolve("constants"),
      "os": require.resolve("os-browserify"),

      "fs": false,
      "child_process": false,
      "readline": false,
    }
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
