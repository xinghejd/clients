import { Program } from "./program.js";
import { ServiceContainer } from "./service-container.js";
import { SendProgram } from "./tools/send/send.program.js";
import { VaultProgram } from "./vault.program.js";

/**
 * All OSS licensed programs should be registered here.
 * @example
 * const myProgram = new myProgram(serviceContainer);
 * myProgram.register();
 * @param serviceContainer A class that instantiates services and makes them available for dependency injection
 */
export async function registerOssPrograms(serviceContainer: ServiceContainer) {
  const program = new Program(serviceContainer);
  await program.register();

  const vaultProgram = new VaultProgram(serviceContainer);
  vaultProgram.register();

  const sendProgram = new SendProgram(serviceContainer);
  sendProgram.register();
}
