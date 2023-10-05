import { UserState } from "@bitwarden/common/platform/interfaces/user-state";
import { DefaultUserStateProvider, KeyDefinition } from "@bitwarden/common/platform/state";

import { BackgroundUserState } from "./background-user-state";

export class BackgroundUserStateProvider extends DefaultUserStateProvider {
  override buildUserState<T>(keyDefinition: KeyDefinition<T>): UserState<T> {
    return new BackgroundUserState<T>(
      keyDefinition,
      this.accountService,
      this.encryptService,
      this.memoryStorage,
      this.secureStorage,
      this.diskStorage
    );
  }
}
