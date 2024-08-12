import { map, Observable } from "rxjs";

import {
  DefaultLockComponentService,
  LockComponentService,
  UnlockOptions,
} from "@bitwarden/auth/angular";
import {
  UserDecryptionOptions,
  UserDecryptionOptionsServiceAbstraction,
} from "@bitwarden/auth/common";
import { UserId } from "@bitwarden/common/types/guid";

export class DesktopLockComponentService
  extends DefaultLockComponentService
  implements LockComponentService
{
  constructor(private userDecryptionOptionsService: UserDecryptionOptionsServiceAbstraction) {
    super();
  }

  override async isWindowVisible(): Promise<boolean> {
    return ipc.platform.isWindowVisible();
  }

  override async biometricsEnabled(userId: UserId): Promise<boolean> {
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
