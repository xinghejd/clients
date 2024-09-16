import { BitwardenClient } from "@bitwarden/sdk-wasm";

import { SdkClientFactory } from "../../abstractions/sdk/sdk-client-factory";

export class DefaultSdkClientFactory implements SdkClientFactory {
  createSdkClient(
    ...args: ConstructorParameters<typeof BitwardenClient>
  ): Promise<BitwardenClient> {
    return Promise.resolve(new BitwardenClient(...args));
  }
}
