import * as sdk from "@bitwarden/sdk-internal";

import { SdkClientFactory } from "../../abstractions/sdk/sdk-client-factory";

export class DefaultSdkClientFactory implements SdkClientFactory {
  async createSdkClient(
    ...args: ConstructorParameters<typeof sdk.BitwardenClient>
  ): Promise<sdk.BitwardenClient> {
    const module = await import("@bitwarden/sdk-internal/bitwarden_wasm_internal_bg.wasm");
    (sdk as any).init(module);

    return Promise.resolve(new sdk.BitwardenClient(...args));
  }
}
