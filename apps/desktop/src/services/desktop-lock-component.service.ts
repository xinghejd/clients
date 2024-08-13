import { map, Observable } from "rxjs";

import { LockComponentService, UnlockOptions } from "@bitwarden/auth/angular";
import {
  UserDecryptionOptions,
  UserDecryptionOptionsServiceAbstraction,
} from "@bitwarden/auth/common";
import { UserId } from "@bitwarden/common/types/guid";

export class DesktopLockComponentService implements LockComponentService {
  constructor(private userDecryptionOptionsService: UserDecryptionOptionsServiceAbstraction) {}

  getBiometricsError(error: any): string | null {
    return null;
  }

  async isFido2Session(): Promise<boolean> {
    return false;
  }

  async isWindowVisible(): Promise<boolean> {
    return ipc.platform.isWindowVisible();
  }

  async biometricsEnabled(userId: UserId): Promise<boolean> {
    return await ipc.platform.biometric.enabled(userId);
  }

  getAvailableUnlockOptions$(userId: UserId): Observable<UnlockOptions> {
    // TODO: enhance this to include PIN and biometrics

    return this.userDecryptionOptionsService.userDecryptionOptionsById$(userId).pipe(
      map((userDecryptionOptions: UserDecryptionOptions) => {
        const unlockOpts: UnlockOptions = {
          masterPasswordEnabled: userDecryptionOptions.hasMasterPassword,
          pinEnabled: false,
          biometrics: {
            enabled: false,
            disableReason: null,
          },
        };
        return unlockOpts;
      }),
    );
  }
}
