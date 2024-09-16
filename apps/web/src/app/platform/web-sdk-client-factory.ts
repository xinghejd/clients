import { SdkClientFactory } from "@bitwarden/common/platform/abstractions/sdk/sdk-client-factory";
import type { BitwardenClient } from "@bitwarden/sdk-wasm";

export class WebSdkClientFactory implements SdkClientFactory {
  async createSdkClient(
    ...args: ConstructorParameters<typeof BitwardenClient>
  ): Promise<BitwardenClient> {
    const module = await import("@bitwarden/sdk-wasm/fallback" as any);

    return Promise.resolve(new module.BitwardenClient(...args));
  }
}
