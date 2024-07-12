import { program } from "commander";

import { OssServeConfigurator } from "./oss-serve-configurator.js";
import { registerOssPrograms } from "./register-oss-programs.js";
import { ServeProgram } from "./serve.program.js";
import { ServiceContainer } from "./service-container.js";

async function main() {
  const serviceContainer = new ServiceContainer();
  await serviceContainer.init();

  await registerOssPrograms(serviceContainer);

  // ServeProgram is registered separately so it can be overridden by bit-cli
  const serveConfigurator = new OssServeConfigurator(serviceContainer);
  new ServeProgram(serviceContainer, serveConfigurator).register();

  program.parse(process.argv);
}

// Node does not support top-level await statements until ES2022, esnext, etc which we don't use yet
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
