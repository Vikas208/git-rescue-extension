//@ts-check
"use strict";

const path = require("path");

/** @typedef {import('webpack').Configuration} WebpackConfig */

/** @type WebpackConfig */
const extensionConfig = {
  target: "node", // VS Code extensions run in a Node.js context
  mode: "none", // use "production" when packaging for release

  entry: "./src/extension.ts", 
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },

  externals: {
    vscode: "commonjs vscode", // required by VS Code
    "tree-sitter": "commonjs tree-sitter", // exclude native modules
    "tree-sitter-javascript": "commonjs tree-sitter-javascript",
    "tree-sitter-typescript": "commonjs tree-sitter-typescript",
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
    ],
  },

  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log", 
  },
};

module.exports = [extensionConfig];
