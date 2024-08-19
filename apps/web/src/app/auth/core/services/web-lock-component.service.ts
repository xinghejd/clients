import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

import { LockComponentService, UnlockOptions } from "@bitwarden/auth/angular";
import {
  UserDecryptionOptions,
  UserDecryptionOptionsServiceAbstraction,
} from "@bitwarden/auth/common";
import { UserId } from "@bitwarden/common/types/guid";

@Injectable({ providedIn: "root" })
export class WebLockComponentService implements LockComponentService {
  private readonly userDecryptionOptionsService = inject(UserDecryptionOptionsServiceAbstraction);

  constructor() {}

  getBiometricsError(error: any): string | null {
    throw new Error("Method not implemented.");
  }

  async isFido2Session(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async isWindowVisible(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async biometricsEnabled(userId: UserId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getBiometricsUnlockBtnText(): string {
    throw new Error("Method not implemented.");
  }

  getAvailableUnlockOptions$(userId: UserId): Observable<UnlockOptions> {
    return this.userDecryptionOptionsService.userDecryptionOptionsById$(userId).pipe(
      map((userDecryptionOptions: UserDecryptionOptions) => {
        const unlockOpts: UnlockOptions = {
          masterPassword: {
            enabled: userDecryptionOptions.hasMasterPassword,
          },
          pin: {
            enabled: false,
          },
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
