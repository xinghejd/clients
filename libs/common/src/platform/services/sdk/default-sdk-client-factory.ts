import type { BitwardenClient } from "@bitwarden/sdk-wasm";

import { SdkClientFactory } from "../../abstractions/sdk/sdk-client-factory";

export class DefaultSdkClientFactory implements SdkClientFactory {
  async createSdkClient(
    ...args: ConstructorParameters<typeof BitwardenClient>
  ): Promise<BitwardenClient> {
    const module = await import("@bitwarden/sdk-wasm");
    return Promise.resolve(new module.BitwardenClient(...args));
  }
}
