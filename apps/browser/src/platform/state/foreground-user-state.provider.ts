import { UserState } from "@bitwarden/common/platform/interfaces/user-state";
import { DefaultUserStateProvider, KeyDefinition } from "@bitwarden/common/platform/state";

import { ForegroundUserState } from "./foreground-user-state";

export class ForegroundUserStateProvider extends DefaultUserStateProvider {
  override buildUserState<T>(keyDefinition: KeyDefinition<T>): UserState<T> {
    return new ForegroundUserState<T>(
      keyDefinition,
      this.accountService,
      this.encryptService,
      this.memoryStorage,
      this.secureStorage,
      this.diskStorage
    );
  }
}
