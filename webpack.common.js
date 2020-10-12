const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: "./src/BlobCache",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "BlobCache.js",
    library: "blobcache",
  },
  plugins: [new CleanWebpackPlugin()],
  resolve: { extensions: [".ts", ".js"] },
  module: {
    rules: [
      {
        test: /\.{js|ts|tsx|jsx}$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: { browsers: "defaults" } }],
              "@babel/preset-typescript",
            ],
            plugins: [
              "@babel/proposal-class-properties",
              "@babel/proposal-object-rest-spread",
              "@babel/plugin-transform-runtime",
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.html$/,
        use: [{ loader: "html-loader" }],
      },
    ],
  },
};