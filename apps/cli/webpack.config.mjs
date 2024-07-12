import path from "path";
import webpack from "webpack";
import CopyWebpackPlugin from "copy-webpack-plugin";
import nodeExternals from "webpack-node-externals";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import { load, log } from "./config/config.js";
import { fileURLToPath } from "url";

if (process.env.NODE_ENV == null) {
  process.env.NODE_ENV = "development";
}
const ENV = (process.env.ENV = process.env.NODE_ENV);

const envConfig = await load(ENV);
log(envConfig);

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const moduleRules = [
  {
    test: /\.ts$/,
    use: "ts-loader",
    exclude: path.resolve(__dirname, "node_modules"),
  },
];

const plugins = [
  new CopyWebpackPlugin({
    patterns: [{ from: "./src/locales", to: "locales" }],
  }),
  new webpack.DefinePlugin({
    "process.env.BWCLI_ENV": JSON.stringify(ENV),
  }),
  new webpack.BannerPlugin({
    banner: "#!/usr/bin/env node",
    raw: true,
  }),
  new webpack.IgnorePlugin({
    resourceRegExp: /^encoding$/,
    contextRegExp: /node-fetch/,
  }),
  new webpack.EnvironmentPlugin({
    BWCLI_ENV: ENV,
    FLAGS: envConfig.default.flags,
  }),
  new webpack.IgnorePlugin({
    resourceRegExp: /canvas/,
    contextRegExp: /jsdom$/,
  }),
];

const webpackConfig = {
  mode: ENV,
  target: "node",
  devtool: ENV === "development" ? "eval-source-map" : "source-map",
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: {
    bw: "./src/bw.ts",
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: [".ts", ".js"],
    symlinks: false,
    modules: [path.resolve("../../node_modules")],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
    clean: true,
  },
  module: { rules: moduleRules },
  plugins: plugins,
  externals: [
    nodeExternals({
      modulesDir: "../../node_modules",
      allowlist: [/@bitwarden/],
    }),
  ],
};

export default webpackConfig;
