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
  resolve: { extensions: [".ts"] },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
    ],
  },
};
