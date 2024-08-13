import { firstValueFrom, Observable, of } from "rxjs";

import { LockComponentService, UnlockOptions } from "@bitwarden/auth/angular";
import { UserId } from "@bitwarden/common/types/guid";

import { BiometricErrors, BiometricErrorTypes } from "../models/biometricErrors";
import {
  fido2PopoutSessionData$,
  Fido2SessionData,
} from "../vault/popup/utils/fido2-popout-session-data";

// TODO: consider throwing not implemented exceptions for unsupported methods.
export class ExtensionLockComponentService implements LockComponentService {
  async isFido2Session(): Promise<boolean> {
    const fido2SessionData: Fido2SessionData = await firstValueFrom(fido2PopoutSessionData$());
    return fido2SessionData.isFido2Session;
  }

  getBiometricsError(error: any): string | null {
    const biometricsError = BiometricErrors[error?.message as BiometricErrorTypes];

    if (!biometricsError) {
      return null;
    }

    return biometricsError.description;
  }

  async isWindowVisible(): Promise<boolean> {
    return false;
  }

  async biometricsEnabled(userId: UserId): Promise<boolean> {
    return false;
  }

  getAvailableUnlockOptions$(userId: UserId): Observable<UnlockOptions> {
    // TODO: enhance this.
    return of({
      masterPasswordEnabled: true,
      pinEnabled: false,
      biometrics: {
        enabled: false,
        disableReason: null,
      },
    });
  }
}
