import { AngularWebpackPlugin } from "@ngtools/webpack";

import webpackConfig from "../../apps/web/webpack.config.js";

webpackConfig.entry["app/main"] = "../../bitwarden_license/bit-web/src/main.ts";
webpackConfig.plugins[webpackConfig.plugins.length - 1] = new AngularWebpackPlugin({
  tsConfigPath: "tsconfig.json",
  entryModule: "bitwarden_license/src/app/app.module#AppModule",
  sourceMap: true,
});

export default webpackConfig;
